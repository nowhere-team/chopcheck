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
}

export class ReceiptScanner {
	private _state = $state<ScannerState>('idle')

	context = $state<ScannerContext>({
		itemsCount: 0
	})

	get state(): ScannerState {
		return this._state
	}

	get isScanning(): boolean {
		return (
			this._state === 'connecting' || this._state === 'processing' || this._state === 'saving'
		)
	}

	start(): void {
		if (this._state !== 'idle') return
		this.resetContext()
		this._state = 'connecting'
	}

	handleStreamEvent(event: ReceiptStreamEvent): void {
		switch (event.type) {
			case 'started':
				if (this._state === 'idle') {
					this.start()
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
				// receipt event contains final receipt metadata before completed
				// можно использовать для дополнительной информации если нужно
				break
			}

			case 'completed': {
				this.context.receiptData = event.data
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
				// если стрим закончился без completed и мы всё ещё в processing
				// это может быть ошибкой
				if (this._state === 'connecting' || this._state === 'processing') {
					if (!this.context.receiptData) {
						this.context.error = 'Соединение прервано'
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
			receiptData: undefined
		}
	}
}
