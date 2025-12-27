// noinspection JSUnusedGlobalSymbols

import type {
	EnrichRequest,
	EnrichResponse,
	ImageMetadata,
	SavedImageInfo,
	StreamEvent,
	Warning,
} from '@nowhere-team/catalog'
import { CatalogClient } from '@nowhere-team/catalog'

import type { FnsClient, FnsReceiptData } from '@/platform/fns'
import type { Logger } from '@/platform/logger'
import type { SpanContext } from '@/platform/tracing'
import type { ReceiptsRepository, ReceiptWithItems } from '@/repositories'

import type { ProcessedReceipt, ReceiptStreamEvent, ReceiptWithImages } from './types'

export interface ReceiptsServiceConfig {
	maxImagesPerRequest: number
}

export class ReceiptsService {
	constructor(
		private readonly repo: ReceiptsRepository,
		private readonly fns: FnsClient,
		private readonly catalog: CatalogClient,
		private readonly config: ReceiptsServiceConfig,
		private readonly logger: Logger,
	) {}

	async getById(receiptId: string, userId: string): Promise<ReceiptWithItems | null> {
		return this.repo.findByIdWithItems(receiptId, userId)
	}

	async listByUser(userId: string, options: { limit?: number; offset?: number } = {}): Promise<ReceiptWithItems[]> {
		return this.repo.findByUser(userId, options)
	}

	async getWithImages(receiptId: string, userId: string): Promise<ReceiptWithImages | null> {
		const data = await this.repo.findByIdWithItems(receiptId, userId)
		if (!data) return null

		const savedImages = await this.getRefreshedImages(data.receipt)

		return {
			receipt: data.receipt,
			items: data.items,
			imageMetadata: (data.receipt.imageMetadata as ImageMetadata[]) || [],
			savedImages,
		}
	}

	async refreshImageUrls(receiptId: string): Promise<SavedImageInfo[]> {
		const receipt = await this.repo.findById(receiptId)
		if (!receipt) return []

		return this.getRefreshedImages(receipt)
	}

	private async getRefreshedImages(receipt: { id: string; savedImages: unknown }): Promise<SavedImageInfo[]> {
		const savedImages = (receipt.savedImages as SavedImageInfo[]) || []
		if (savedImages.length === 0) return []

		const refreshed: SavedImageInfo[] = []

		for (const img of savedImages) {
			try {
				const urls = await this.catalog.getImageUrls(img.id)
				refreshed.push({
					...img,
					url: urls.url ?? undefined,
					originalUrl: urls.originalUrl,
				})
			} catch (error) {
				this.logger.warn('failed to refresh image url', { imageId: img.id, error })
				refreshed.push(img)
			}
		}

		await this.repo.update(receipt.id, { savedImages: refreshed })
		return refreshed
	}

	async processQr(userId: string, qrRaw: string, span?: SpanContext): Promise<ProcessedReceipt> {
		this.logger.info('processing qr receipt', { userId })

		const qrData = this.fns.parseQrData(qrRaw)
		if (!qrData) throw new Error('invalid qr code format')

		const existing = await this.repo.findByFiscalData(qrData.fn, qrData.i)
		if (existing) {
			const items = await this.repo.getItems(existing.id)
			return { receipt: existing, items, enriched: existing.status === 'enriched' }
		}

		const fnsData = await this.fns.getReceiptByQr(qrRaw, span)

		const receipt = await this.repo.create({
			userId,
			source: 'qr',
			status: 'processing',
			qrRaw,
			fiscalNumber: qrData.fn,
			fiscalDocument: qrData.i,
			fiscalSign: qrData.fp,
			placeName: fnsData.retailPlace || fnsData.user,
			placeAddress: fnsData.retailPlaceAddress,
			placeInn: fnsData.userInn,
			total: fnsData.totalSum || 0,
			fnsData,
			receiptDate: fnsData.dateTime ? new Date(fnsData.dateTime) : undefined,
		})

		const items = await this.createItemsFromFns(receipt.id, fnsData)

		try {
			const enriched = await this.enrichFromStructured(receipt.id, fnsData)
			return { receipt: enriched.receipt!, items: enriched.items, enriched: true }
		} catch (error) {
			this.logger.error('enrichment failed', { receiptId: receipt.id, error })
			await this.repo.update(receipt.id, { status: 'failed', lastError: this.truncateError(error as Error) })
			return { receipt, items, enriched: false }
		}
	}

	async *processQrStream(userId: string, qrRaw: string, span?: SpanContext): AsyncGenerator<ReceiptStreamEvent> {
		yield { type: 'started', data: { source: 'qr' } }

		const qrData = this.fns.parseQrData(qrRaw)
		if (!qrData) {
			yield { type: 'error', data: { message: 'invalid qr code format' } }
			return
		}

		const existing = await this.repo.findByFiscalData(qrData.fn, qrData.i)
		if (existing) {
			if (existing.status === 'enriched') {
				const items = await this.repo.getItems(existing.id)
				const savedImages = await this.getRefreshedImages(existing)
				yield {
					type: 'completed',
					data: {
						receipt: existing,
						items,
						images: existing.imageMetadata,
						savedImages,
						cached: true,
					},
				}
				return
			}

			if (existing.fnsData) {
				yield {
					type: 'fns_fetched',
					data: { itemCount: (existing.fnsData as FnsReceiptData).items?.length || 0 },
				}
				yield* this.streamEnrichmentFromStructured(existing, existing.fnsData as FnsReceiptData, userId)
				return
			}

			const items = await this.repo.getItems(existing.id)
			yield { type: 'completed', data: { receipt: existing, items, cached: true } }
			return
		}

		let fnsData: FnsReceiptData
		try {
			fnsData = await this.fns.getReceiptByQr(qrRaw, span)
			yield { type: 'fns_fetched', data: { itemCount: fnsData.items?.length || 0 } }
		} catch (error) {
			yield { type: 'error', data: { message: (error as Error).message, stage: 'fns' } }
			return
		}

		const receipt = await this.repo.create({
			userId,
			source: 'qr',
			status: 'processing',
			qrRaw,
			fiscalNumber: qrData.fn,
			fiscalDocument: qrData.i,
			fiscalSign: qrData.fp,
			placeName: fnsData.retailPlace || fnsData.user,
			placeAddress: fnsData.retailPlaceAddress,
			placeInn: fnsData.userInn,
			total: fnsData.totalSum || 0,
			fnsData,
			receiptDate: fnsData.dateTime ? new Date(fnsData.dateTime) : undefined,
		})

		yield* this.streamEnrichmentFromStructured(receipt, fnsData, userId)
	}

	async processImages(
		userId: string,
		images: string[],
		options?: { saveImages?: boolean },
	): Promise<ProcessedReceipt> {
		this.logger.info('processing image receipt', { userId, imageCount: images.length })

		if (images.length === 0) {
			throw new Error('at least one image is required')
		}

		if (images.length > this.config.maxImagesPerRequest) {
			throw new Error(`too many images: max ${this.config.maxImagesPerRequest}, got ${images.length}`)
		}

		const receipt = await this.repo.create({ userId, source: 'image', status: 'processing', total: 0 })

		try {
			const request = this.buildImageRequest(images, options?.saveImages)
			const enriched = await this.catalog.enrich(request)

			await this.saveEnrichmentResult(receipt.id, enriched)

			const items = await this.repo.getItems(receipt.id)
			const updated = await this.repo.findById(receipt.id)

			return { receipt: updated!, items, enriched: true }
		} catch (error) {
			await this.repo.update(receipt.id, { status: 'failed', lastError: this.truncateError(error as Error) })
			throw error
		}
	}

	async *processImagesStream(
		userId: string,
		images: string[],
		options?: { saveImages?: boolean },
	): AsyncGenerator<ReceiptStreamEvent> {
		yield { type: 'started', data: { source: 'image', imageCount: images.length } }

		if (images.length === 0) {
			yield { type: 'error', data: { message: 'at least one image is required' } }
			return
		}

		if (images.length > this.config.maxImagesPerRequest) {
			yield { type: 'error', data: { message: `too many images: max ${this.config.maxImagesPerRequest}` } }
			return
		}

		const receipt = await this.repo.create({ userId, source: 'image', status: 'processing', total: 0 })

		try {
			const request = this.buildImageRequest(images, options?.saveImages)

			for await (const event of this.catalog.enrichStream(request)) {
				yield* this.mapCatalogEvent(event, receipt.id, userId)
			}
		} catch (error) {
			await this.repo.update(receipt.id, { status: 'failed', lastError: this.truncateError(error as Error) })
			yield { type: 'error', data: { message: (error as Error).message, stage: 'enrichment' } }
		}
	}

	private async *streamEnrichmentFromStructured(
		receipt: { id: string; imageMetadata?: unknown; savedImages?: unknown },
		fnsData: FnsReceiptData,
		userId: string,
	): AsyncGenerator<ReceiptStreamEvent> {
		const request = this.buildStructuredRequest(fnsData)

		try {
			for await (const event of this.catalog.enrichStream(request)) {
				yield* this.mapCatalogEvent(event, receipt.id, userId)
			}
		} catch (error) {
			this.logger.warn('enrichment failed, saving raw items', { receiptId: receipt.id, error })
			await this.createItemsFromFns(receipt.id, fnsData)
			await this.repo.update(receipt.id, { status: 'failed', lastError: this.truncateError(error as Error) })
			yield { type: 'error', data: { message: (error as Error).message, stage: 'enrichment' } }
		}
	}

	private async *mapCatalogEvent(
		event: StreamEvent,
		receiptId: string,
		userId: string,
	): AsyncGenerator<ReceiptStreamEvent> {
		switch (event.type) {
			case 'started':
				yield { type: 'started', data: event.data }
				break

			case 'image_meta':
				yield { type: 'image_meta', data: event.data }
				break

			case 'item':
				yield { type: 'item', data: event.data }
				break

			case 'place':
				yield { type: 'place', data: event.data }
				break

			case 'receipt':
				yield { type: 'receipt', data: event.data }
				break

			case 'language':
				yield { type: 'language', data: event.data }
				break

			case 'warning':
				yield { type: 'warning', data: event.data }
				break

			case 'completed': {
				const enriched = (event.data as { response: EnrichResponse }).response
				await this.saveEnrichmentResult(receiptId, enriched)

				const updated = await this.repo.findByIdWithItems(receiptId, userId)
				yield {
					type: 'completed',
					data: {
						receipt: updated?.receipt,
						items: updated?.items,
						images: enriched.images,
						savedImages: enriched.savedImages,
						cached: enriched.cached,
					},
				}
				break
			}

			case 'error':
				yield { type: 'error', data: event.data }
				break
		}
	}

	private async enrichFromStructured(receiptId: string, fnsData: FnsReceiptData) {
		const request = this.buildStructuredRequest(fnsData)
		const enriched = await this.catalog.enrich(request)

		await this.saveEnrichmentResult(receiptId, enriched)

		const receipt = await this.repo.findById(receiptId)
		const items = await this.repo.getItems(receiptId)

		return { receipt, items }
	}

	private async saveEnrichmentResult(receiptId: string, enriched: EnrichResponse): Promise<void> {
		await this.createEnrichedItems(receiptId, enriched)

		const total = enriched.receipt?.total
			? Math.round(enriched.receipt.total * 100)
			: enriched.items.reduce((sum, item) => sum + (item.sum || 0) * 100, 0)

		await this.repo.update(receiptId, {
			status: 'enriched',
			total,
			placeName: enriched.place?.name ?? undefined,
			placeAddress: enriched.place?.address ?? undefined,
			enrichmentData: enriched,
			enrichedAt: new Date(),
			imageMetadata: enriched.images,
			savedImages: enriched.savedImages,
			detectedLanguage: enriched.language,
		})
	}

	private async createItemsFromFns(receiptId: string, fnsData: FnsReceiptData) {
		if (!fnsData.items?.length) return []

		return this.repo.createItems(
			receiptId,
			fnsData.items.map((item, i) => ({
				rawName: item.name,
				price: item.price,
				quantity: String(item.quantity),
				sum: item.sum,
				displayOrder: i,
				suggestedSplitMethod: 'by_fraction',
			})),
		)
	}

	private async createEnrichedItems(receiptId: string, enriched: EnrichResponse) {
		if (!enriched.items?.length) return []

		return this.repo.createItems(
			receiptId,
			enriched.items.map((ei, i) => ({
				rawName: ei.rawName,
				name: ei.name,
				category: ei.category,
				subcategory: ei.subcategory,
				emoji: this.normalizeEmoji(ei.emoji),
				tags: ei.tags,
				price: Math.round((ei.price || 0) * 100),
				quantity: String(ei.quantity || 1),
				unit: ei.unit,
				sum: Math.round((ei.sum || 0) * 100),
				discount: ei.discount ? Math.round(ei.discount * 100) : 0,
				bbox: ei.bbox ?? null,
				suggestedSplitMethod: this.mapSplitMethod(ei.splitMethod),
				displayOrder: i,
				catalogItemId: (ei as any).id,
				warnings: this.getItemWarnings(enriched, i),
			})),
		)
	}

	private buildImageRequest(images: string[], saveImage?: boolean): EnrichRequest {
		const normalized = images.map(img => (img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`))

		return {
			type: 'receipt',
			source: {
				type: 'image',
				data: normalized.length === 1 ? normalized[0]! : normalized,
			},
			saveImage,
		}
	}

	private buildStructuredRequest(fnsData: FnsReceiptData): EnrichRequest {
		return {
			type: 'receipt',
			source: {
				type: 'structured',
				data: {
					items: (fnsData.items || []).map(item => ({
						name: item.name,
						quantity: item.quantity,
						price: item.price / 100,
						sum: item.sum / 100,
					})),
					place: fnsData.retailPlace
						? {
								name: fnsData.retailPlace,
								address: fnsData.retailPlaceAddress,
								inn: fnsData.userInn,
							}
						: undefined,
					total: fnsData.totalSum ? fnsData.totalSum / 100 : undefined,
					date: fnsData.dateTime,
				},
			},
		}
	}

	private mapSplitMethod(catalogMethod?: string): 'by_fraction' | 'by_amount' | 'per_unit' | 'custom' {
		if (!catalogMethod) return 'per_unit'

		switch (catalogMethod) {
			case 'by_fraction':
				return 'by_fraction'
			case 'by_amount':
				return 'by_amount'
			case 'per_unit':
				return 'per_unit'
			case 'not_shareable':
				return 'per_unit'
			default:
				return 'per_unit'
		}
	}

	private truncateError(error: Error | string, maxLength = 2000): string {
		const msg = error instanceof Error ? error.message : String(error)
		return msg.length > maxLength ? msg.slice(0, maxLength) + '...' : msg
	}

	private normalizeEmoji(emoji?: string): string | undefined {
		if (!emoji) return undefined
		const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })
		const first = segmenter.segment(emoji)[Symbol.iterator]().next().value
		return first?.segment
	}

	private getItemWarnings(enriched: EnrichResponse, index: number): Warning[] {
		return enriched.warnings?.filter(w => w.itemIndex === index) || []
	}
}
