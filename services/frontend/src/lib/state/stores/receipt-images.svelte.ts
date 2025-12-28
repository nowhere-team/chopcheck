import { api } from '$lib/services/api/client'
import type { ImageMetadataDto, ReceiptItemDto, SavedImageInfoDto } from '$lib/services/api/types'
import { createLogger } from '$lib/shared/logger'

const log = createLogger('receipt-images')

interface ReceiptImagesData {
	receiptId: string
	imageMetadata: ImageMetadataDto[]
	savedImages: SavedImageInfoDto[]
	items: ReceiptItemDto[]
	loadedAt: number
}

interface ImageDimensions {
	width: number
	height: number
}

const CACHE_TTL = 50 * 60 * 1000 // 50 minutes (images expire in 1 hour)

class ReceiptImagesStore {
	private cache = $state<Map<string, ReceiptImagesData>>(new Map())
	private dimensionsCache = $state<Map<string, ImageDimensions>>(new Map())
	private loading = $state<Set<string>>(new Set())
	private refreshing = $state<Set<string>>(new Set())

	isLoading(receiptId: string): boolean {
		return this.loading.has(receiptId)
	}

	isRefreshing(receiptId: string): boolean {
		return this.refreshing.has(receiptId)
	}

	get(receiptId: string): ReceiptImagesData | null {
		const data = this.cache.get(receiptId)
		if (!data) return null

		// check if cache is stale
		if (Date.now() - data.loadedAt > CACHE_TTL) {
			this.refresh(receiptId)
		}

		return data
	}

	getImageForItem(receiptId: string, imageIndex: number): SavedImageInfoDto | null {
		const data = this.cache.get(receiptId)
		if (!data) return null

		return data.savedImages.find(img => img.index === imageIndex) ?? null
	}

	getImageMetadata(receiptId: string, imageIndex: number): ImageMetadataDto | null {
		const data = this.cache.get(receiptId)
		if (!data) return null

		return data.imageMetadata.find(meta => meta.index === imageIndex) ?? null
	}

	getImageDimensions(url: string): ImageDimensions | null {
		return this.dimensionsCache.get(url) ?? null
	}

	setImageDimensions(url: string, dimensions: ImageDimensions): void {
		this.dimensionsCache.set(url, dimensions)
	}

	async load(receiptId: string): Promise<ReceiptImagesData | null> {
		const cached = this.cache.get(receiptId)
		if (cached && Date.now() - cached.loadedAt < CACHE_TTL) {
			return cached
		}

		if (this.loading.has(receiptId)) {
			// wait for existing load
			return new Promise(resolve => {
				const check = () => {
					if (!this.loading.has(receiptId)) {
						resolve(this.cache.get(receiptId) ?? null)
					} else {
						setTimeout(check, 100)
					}
				}
				check()
			})
		}

		this.loading.add(receiptId)

		try {
			const response = await api.get<{
				receiptId: string
				imageMetadata: ImageMetadataDto[]
				savedImages: SavedImageInfoDto[]
				items: ReceiptItemDto[]
			}>(`receipts/${receiptId}/images`)

			const data: ReceiptImagesData = {
				...response,
				loadedAt: Date.now()
			}

			this.cache.set(receiptId, data)
			log.debug('loaded receipt images', { receiptId, imageCount: data.savedImages.length })

			return data
		} catch (e) {
			log.error('failed to load receipt images', { receiptId, error: e })
			return null
		} finally {
			this.loading.delete(receiptId)
		}
	}

	async refresh(receiptId: string): Promise<boolean> {
		if (this.refreshing.has(receiptId)) return false

		this.refreshing.add(receiptId)

		try {
			const response = await api.post<{
				success: boolean
				savedImages: SavedImageInfoDto[]
			}>(`receipts/${receiptId}/images/refresh`)

			if (response.success) {
				const existing = this.cache.get(receiptId)
				if (existing) {
					this.cache.set(receiptId, {
						...existing,
						savedImages: response.savedImages,
						loadedAt: Date.now()
					})
				}
				log.debug('refreshed receipt images', { receiptId })
				return true
			}
			return false
		} catch (e) {
			log.error('failed to refresh receipt images', { receiptId, error: e })
			return false
		} finally {
			this.refreshing.delete(receiptId)
		}
	}

	clear(receiptId?: string): void {
		if (receiptId) {
			this.cache.delete(receiptId)
		} else {
			this.cache.clear()
		}
	}
}

export const receiptImagesStore = new ReceiptImagesStore()
