import type { ReceiptCompleteData, ReceiptStreamEvent } from './stream'

export type ScannerState = 'idle' | 'connecting' | 'processing' | 'saving' | 'completed' | 'error'

export interface ScannerContext {
	storeName?: string
	placeEmoji?: string
	itemsCount: number
	totalItems?: number
	lastItem?: string
	error?: string
	receiptData?: ReceiptCompleteData
	isCached?: boolean
}

// Singleton state class
class ReceiptScannerManager {
	private _state = $state<ScannerState>('idle')

	context = $state<ScannerContext>({
		itemsCount: 0,
		isCached: false
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

	start(): void {
		if (this._state !== 'idle' && this._state !== 'error') return
		this.resetContext()
		this._state = 'connecting'
	}

	handleStreamEvent(event: ReceiptStreamEvent): void {
		switch (event.type) {
			case 'started':
				if (this._state === 'idle') {
					this._state = 'connecting'
				}
				break

			case 'fns_fetched': {
				const data = event.data
				if (data.itemCount) {
					this.context.totalItems = data.itemCount
				}
				this.transitionToProcessing()
				break
			}

			case 'item': {
				const raw = event.data
				const item = raw.item ?? raw

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
				const raw = event.data
				const place = raw.place ?? raw
				if (place.name) {
					this.context.storeName = place.name
				}
				if (place.emoji) {
					this.context.placeEmoji = place.emoji
				}
				break
			}

			case 'receipt': {
				break
			}

			case 'completed': {
				this.context.receiptData = event.data
				if (event.data.cached) {
					this.context.isCached = true
				}
				if (this._state === 'connecting' || this._state === 'processing') {
					this._state = 'saving'
				}
				break
			}

			case 'error': {
				this.context.error = event.data?.message || 'Неизвестная ошибка'
				this._state = 'error'
				break
			}

			case 'stream_end': {
				// fix: if connection closes without full completion
				if (this._state === 'connecting' || this._state === 'processing') {
					if (!this.context.receiptData) {
						this.context.error = 'Кажется, распознавание чека было прервано'
						this._state = 'error'
					}
				}
				break
			}
		}
	}

	saved(): void {
		if (this._state === 'saving') {
			this._state = 'completed'
			// Auto reset handled by UI delay usually, but safety clear here
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
	}

	reset(): void {
		this._state = 'idle'
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
			receiptData: undefined,
			isCached: false
		}
	}
}

export const receiptScanner = new ReceiptScannerManager()
