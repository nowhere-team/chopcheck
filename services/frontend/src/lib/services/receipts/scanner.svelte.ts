// file: services/frontend/src/lib/services/receipts/scanner.svelte.ts
import type { ImageMetadata, SavedImageInfo } from '$lib/services/api/types'

import type { ReceiptCompleteData, ReceiptStreamEvent } from './stream'

export type ScannerState = 'idle' | 'connecting' | 'processing' | 'saving' | 'completed' | 'error'

export interface ScannerContext {
	storeName?: string
	placeEmoji?: string
	itemsCount: number
	totalItems?: number
	lastItem?: string
	error?: string
	warnings?: string[]
	receiptData?: ReceiptCompleteData
	isCached?: boolean
	// image data
	imageCount?: number
	processedImages?: number
	images?: ImageMetadata[]
	savedImages?: SavedImageInfo[]
}

class ReceiptScannerManager {
	private _state = $state<ScannerState>('idle')
	private _isLocked = false

	context = $state<ScannerContext>({
		itemsCount: 0,
		isCached: false,
		warnings: []
	})

	get state(): ScannerState {
		return this._state
	}

	get isScanning(): boolean {
		return (
			this._state === 'connecting' ||
			this._state === 'processing' ||
			this._state === 'saving' ||
			this._state === 'completed'
		)
	}

	start(): boolean {
		if (this._isLocked || this.isScanning) {
			console.warn('[scanner] already running, ignoring start()')
			return false
		}

		this._isLocked = true
		this.resetContext()
		this._state = 'connecting'
		return true
	}

	handleStreamEvent(event: ReceiptStreamEvent): void {
		if (this._state === 'idle' || this._state === 'error' || this._state === 'completed') {
			return
		}

		switch (event.type) {
			case 'started': {
				this._state = 'connecting'
				const data = event.data as { imageCount?: number }
				if (data.imageCount) {
					this.context.imageCount = data.imageCount
				}
				break
			}

			case 'fns_fetched': {
				const data = event.data as { itemCount?: number }
				if (data.itemCount) {
					this.context.totalItems = data.itemCount
				}
				this.transitionToProcessing()
				break
			}

			case 'image_meta': {
				const raw = event.data as { image?: ImageMetadata } | ImageMetadata
				const image: ImageMetadata | undefined = 'index' in raw ? raw : raw.image

				if (image) {
					this.context.images = [...(this.context.images || []), image]
					this.context.processedImages = (this.context.processedImages || 0) + 1
				}
				this.transitionToProcessing()
				break
			}

			case 'item': {
				const raw = event.data as Record<string, unknown>
				const item = (raw.item ?? raw) as {
					name?: string
					rawName?: string
					emoji?: string
					quantity?: number
				}

				const name = item.name || item.rawName || 'Товар'
				const emoji = item.emoji ?? ''
				const qty = item.quantity ?? 1

				const qtyDisplay = Number.isInteger(qty) ? qty : parseFloat(qty.toFixed(2))

				this.context.itemsCount++
				this.context.lastItem =
					`${emoji} ${name}${qtyDisplay > 1 ? ` ×${qtyDisplay}` : ''}`.trim()

				this.transitionToProcessing()
				break
			}

			case 'place': {
				const raw = event.data as Record<string, unknown>
				const place = (raw.place ?? raw) as { name?: string; emoji?: string }
				if (place.name) {
					this.context.storeName = place.name
				}
				if (place.emoji) {
					this.context.placeEmoji = place.emoji
				}
				break
			}

			case 'warning': {
				const raw = event.data as { warning?: { translated?: string; details?: string } }
				const w = raw.warning ?? (raw as { translated?: string; details?: string })
				const message = w.translated || w.details || 'Предупреждение при обработке'

				this.context.warnings = [...(this.context.warnings || []), message]
				break
			}

			case 'receipt':
				break

			case 'completed': {
				const data = event.data as ReceiptCompleteData
				this.context.receiptData = data
				if (data.cached) {
					this.context.isCached = true
				}
				if (data.images) {
					this.context.images = data.images
				}
				if (data.savedImages) {
					this.context.savedImages = data.savedImages
				}
				if (this._state === 'connecting' || this._state === 'processing') {
					this._state = 'saving'
				}
				break
			}

			case 'error': {
				const data = event.data as { message?: string }
				this.context.error = data?.message || 'Неизвестная ошибка'
				this._state = 'error'
				this._isLocked = false
				break
			}

			case 'stream_end': {
				if (this._state === 'connecting' || this._state === 'processing') {
					if (!this.context.receiptData) {
						this.context.error = 'Кажется, распознавание чека было прервано'
						this._state = 'error'
						this._isLocked = false
					}
				}
				break
			}
		}
	}

	saved(): void {
		if (this._state === 'saving') {
			this._state = 'completed'
			setTimeout(() => {
				if (this._state === 'completed') {
					this.reset()
				}
			}, 3000)
		}
	}

	failSave(message: string): void {
		this.context.error = message
		this._state = 'error'
		this._isLocked = false
	}

	reset(): void {
		this._state = 'idle'
		this._isLocked = false
		this.resetContext()
	}

	private transitionToProcessing(): void {
		if (this._state === 'connecting') {
			this._state = 'processing'
		}
	}

	private resetContext(): void {
		this.context = {
			itemsCount: 0,
			storeName: undefined,
			placeEmoji: undefined,
			totalItems: undefined,
			lastItem: undefined,
			error: undefined,
			warnings: [],
			receiptData: undefined,
			isCached: false,
			imageCount: undefined,
			processedImages: undefined,
			images: undefined,
			savedImages: undefined
		}
	}
}

export const receiptScanner = new ReceiptScannerManager()
