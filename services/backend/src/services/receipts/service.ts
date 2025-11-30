import type { CatalogClient, EnrichResponse } from '@/platform/catalog'
import type { FnsClient, FnsReceiptData } from '@/platform/fns'
import type { Logger } from '@/platform/logger'
import type { SpanContext } from '@/platform/tracing'
import type { ReceiptsRepository, ReceiptWithItems } from '@/repositories'

import type { ProcessedReceipt, ReceiptStreamEvent } from './types'

export class ReceiptsService {
	constructor(
		private readonly repo: ReceiptsRepository,
		private readonly fns: FnsClient,
		private readonly catalog: CatalogClient,
		private readonly logger: Logger,
	) {}

	async getById(receiptId: string, userId: string): Promise<ReceiptWithItems | null> {
		return this.repo.findByIdWithItems(receiptId, userId)
	}

	async listByUser(userId: string, options: { limit?: number; offset?: number } = {}): Promise<ReceiptWithItems[]> {
		return this.repo.findByUser(userId, options)
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
			const enriched = await this.enrichReceipt(receipt.id, fnsData, span)
			return { receipt: enriched.receipt!, items: enriched.items, enriched: true }
		} catch (error) {
			this.logger.error('enrichment failed', { receiptId: receipt.id, error })
			await this.repo.update(receipt.id, { status: 'failed', lastError: (error as Error).message })
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

		yield* this.streamEnrichment(receipt, fnsData, userId, span)
	}

	async processImage(userId: string, base64: string, span?: SpanContext): Promise<ProcessedReceipt> {
		this.logger.info('processing image receipt', { userId })

		const receipt = await this.repo.create({ userId, source: 'image', status: 'processing', total: 0 })

		try {
			const enrichRequest = this.catalog.buildImageRequest(base64)
			const enriched = await this.catalog.enrich(enrichRequest, span)

			await this.saveEnrichedItems(receipt.id, enriched)

			const total = enriched.receipt?.total
				? Math.round(enriched.receipt.total * 100)
				: enriched.items.reduce((sum, item) => sum + (item.sum || 0) * 100, 0)

			await this.repo.update(receipt.id, {
				status: 'enriched',
				total,
				placeName: enriched.place?.name,
				placeAddress: enriched.place?.address,
				enrichmentData: enriched,
				enrichedAt: new Date(),
			})

			const items = await this.repo.getItems(receipt.id)
			const updated = await this.repo.findById(receipt.id)

			return { receipt: updated!, items, enriched: true }
		} catch (error) {
			await this.repo.update(receipt.id, { status: 'failed', lastError: (error as Error).message })
			throw error
		}
	}

	async *processImageStream(userId: string, base64: string, span?: SpanContext): AsyncGenerator<ReceiptStreamEvent> {
		yield { type: 'started', data: { source: 'image' } }

		const receipt = await this.repo.create({ userId, source: 'image', status: 'processing', total: 0 })

		try {
			const enrichRequest = this.catalog.buildImageRequest(base64)

			for await (const event of this.catalog.enrichStream(enrichRequest, span)) {
				if (event.type === 'item') yield { type: 'item', data: event.data }
				else if (event.type === 'place') yield { type: 'place', data: event.data }
				else if (event.type === 'receipt') yield { type: 'receipt', data: event.data }
				else if (event.type === 'completed') {
					const enriched = (event.data as any).response as EnrichResponse
					await this.saveEnrichedItems(receipt.id, enriched)

					const total = enriched.receipt?.total
						? Math.round(enriched.receipt.total * 100)
						: enriched.items.reduce((sum, item) => sum + (item.sum || 0) * 100, 0)

					await this.repo.update(receipt.id, {
						status: 'enriched',
						total,
						placeName: enriched.place?.name,
						placeAddress: enriched.place?.address,
						enrichmentData: enriched,
						enrichedAt: new Date(),
					})

					const updated = await this.repo.findByIdWithItems(receipt.id, userId)
					yield {
						type: 'completed',
						data: { receipt: updated?.receipt, items: updated?.items, cached: false },
					}
				}
			}
		} catch (error) {
			await this.repo.update(receipt.id, { status: 'failed', lastError: (error as Error).message })
			yield { type: 'error', data: { message: (error as Error).message, stage: 'enrichment' } }
		}
	}

	private async *streamEnrichment(
		receipt: any,
		fnsData: FnsReceiptData,
		userId: string,
		span?: SpanContext,
	): AsyncGenerator<ReceiptStreamEvent> {
		const enrichRequest = this.catalog.buildStructuredRequest(
			(fnsData.items || []).map(item => ({
				name: item.name,
				quantity: item.quantity,
				price: item.price / 100,
				sum: item.sum / 100,
			})),
			fnsData.retailPlace
				? { name: fnsData.retailPlace, address: fnsData.retailPlaceAddress, inn: fnsData.userInn }
				: undefined,
			fnsData.totalSum ? fnsData.totalSum / 100 : undefined,
			fnsData.dateTime,
		)

		try {
			for await (const event of this.catalog.enrichStream(enrichRequest, span)) {
				if (event.type === 'item') yield { type: 'item', data: event.data }
				else if (event.type === 'place') yield { type: 'place', data: event.data }
				else if (event.type === 'receipt') yield { type: 'receipt', data: event.data }
				else if (event.type === 'completed') {
					const enriched = (event.data as any).response as EnrichResponse
					await this.saveEnrichedItems(receipt.id, enriched)

					await this.repo.update(receipt.id, {
						status: 'enriched',
						enrichmentData: enriched,
						enrichedAt: new Date(),
					})

					const updated = await this.repo.findByIdWithItems(receipt.id, userId)
					yield {
						type: 'completed',
						data: { receipt: updated?.receipt, items: updated?.items, cached: false },
					}
				}
			}
		} catch (error) {
			await this.repo.update(receipt.id, { status: 'failed', lastError: (error as Error).message })
			yield { type: 'error', data: { message: (error as Error).message, stage: 'enrichment' } }
		}
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
			})),
		)
	}

	private async enrichReceipt(receiptId: string, fnsData: FnsReceiptData, span?: SpanContext) {
		const enrichRequest = this.catalog.buildStructuredRequest(
			(fnsData.items || []).map(item => ({
				name: item.name,
				quantity: item.quantity,
				price: item.price / 100,
				sum: item.sum / 100,
			})),
			fnsData.retailPlace
				? { name: fnsData.retailPlace, address: fnsData.retailPlaceAddress, inn: fnsData.userInn }
				: undefined,
			fnsData.totalSum ? fnsData.totalSum / 100 : undefined,
			fnsData.dateTime,
		)

		const enriched = await this.catalog.enrich(enrichRequest, span)
		await this.saveEnrichedItems(receiptId, enriched)
		await this.repo.update(receiptId, { status: 'enriched', enrichmentData: enriched, enrichedAt: new Date() })

		const receipt = await this.repo.findById(receiptId)
		const items = await this.repo.getItems(receiptId)

		return { receipt, items }
	}

	private async saveEnrichedItems(receiptId: string, enriched: EnrichResponse) {
		const existing = await this.repo.getItems(receiptId)

		for (let i = 0; i < enriched.items.length; i++) {
			const ei = enriched.items[i]!
			const ex = existing[i]

			if (ex) {
				await this.repo.updateItem(ex.id, {
					name: ei.name,
					category: ei.category,
					subcategory: ei.subcategory,
					emoji: ei.emoji,
					tags: ei.tags,
					unit: ei.unit,
					suggestedSplitMethod: ei.splitMethod as any,
					catalogItemId: ei.id,
				})
			} else {
				await this.repo.createItems(receiptId, [
					{
						rawName: ei.rawName,
						name: ei.name,
						category: ei.category,
						subcategory: ei.subcategory,
						emoji: ei.emoji,
						tags: ei.tags,
						price: Math.round((ei.price || 0) * 100),
						quantity: String(ei.quantity || 1),
						unit: ei.unit,
						sum: Math.round((ei.sum || 0) * 100),
						discount: ei.discount ? Math.round(ei.discount * 100) : 0,
						suggestedSplitMethod: ei.splitMethod as any,
						displayOrder: i,
						catalogItemId: ei.id,
					},
				])
			}
		}
	}
}
