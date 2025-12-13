import { API_BASE_URL } from '$lib/shared/constants'
import { createLogger } from '$lib/shared/logger'

const log = createLogger('receipt-stream')

export type ReceiptStreamEventType =
	| 'start'
	| 'fetching'
	| 'parsing'
	| 'enriching'
	| 'item'
	| 'complete'
	| 'error'

export interface ReceiptStreamEvent {
	type: ReceiptStreamEventType
	data: unknown
}

export interface ReceiptItem {
	name: string
	price: number
	quantity: string
	type: 'product' | 'tip' | 'delivery' | 'service_fee' | 'tax'
}

export interface ReceiptStartData {
	receiptId: string
}

export interface ReceiptItemData {
	item: ReceiptItem
	index: number
	total: number
}

export interface ReceiptCompleteData {
	receiptId: string
	storeName?: string
	storeAddress?: string
	totalItems: number
	totalAmount: number
}

export interface ReceiptErrorData {
	message: string
	code?: string
}

export type StreamCallback = (event: ReceiptStreamEvent) => void

export async function streamReceiptFromQr(
	qrRaw: string,
	onEvent: StreamCallback,
	signal?: AbortSignal
): Promise<void> {
	const url = `${API_BASE_URL}/receipts/scan/qr/stream`

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify({ qrRaw }),
			signal
		})

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`)
		}

		const reader = response.body?.getReader()
		if (!reader) throw new Error('No response body')

		const decoder = new TextDecoder()
		let buffer = ''

		while (true) {
			const { done, value } = await reader.read()
			if (done) break

			buffer += decoder.decode(value, { stream: true })
			const lines = buffer.split('\n')
			buffer = lines.pop() || ''

			for (const line of lines) {
				if (line.startsWith('event:')) {
					const eventType = line.slice(6).trim()
					const dataLine = lines[lines.indexOf(line) + 1]
					if (dataLine?.startsWith('data:')) {
						try {
							const data = JSON.parse(dataLine.slice(5).trim())
							onEvent({ type: eventType as ReceiptStreamEventType, data })
						} catch (e) {
							log.warn('failed to parse sse data', e)
						}
					}
				}
			}
		}
	} catch (e) {
		if ((e as Error).name === 'AbortError') {
			log.info('stream aborted')
			return
		}
		log.error('stream error', e)
		onEvent({
			type: 'error',
			data: { message: e instanceof Error ? e.message : 'Unknown error' }
		})
	}
}

export async function streamReceiptFromImage(
	imageBase64: string,
	onEvent: StreamCallback,
	signal?: AbortSignal
): Promise<void> {
	const url = `${API_BASE_URL}/receipts/scan/image/stream`

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify({ image: imageBase64 }),
			signal
		})

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`)
		}

		const reader = response.body?.getReader()
		if (!reader) throw new Error('No response body')

		const decoder = new TextDecoder()
		let buffer = ''

		while (true) {
			const { done, value } = await reader.read()
			if (done) break

			buffer += decoder.decode(value, { stream: true })
			const lines = buffer.split('\n')
			buffer = lines.pop() || ''

			let currentEvent: string | null = null

			for (const line of lines) {
				if (line.startsWith('event:')) {
					currentEvent = line.slice(6).trim()
				} else if (line.startsWith('data:') && currentEvent) {
					try {
						const data = JSON.parse(line.slice(5).trim())
						onEvent({ type: currentEvent as ReceiptStreamEventType, data })
					} catch (e) {
						log.warn('failed to parse sse data', e)
					}
					currentEvent = null
				}
			}
		}
	} catch (e) {
		if ((e as Error).name === 'AbortError') {
			log.info('stream aborted')
			return
		}
		log.error('stream error', e)
		onEvent({
			type: 'error',
			data: { message: e instanceof Error ? e.message : 'Unknown error' }
		})
	}
}

export function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => {
			const result = reader.result as string
			// remove data:image/...;base64, prefix
			const base64 = result.split(',')[1]
			resolve(base64 || '')
		}
		reader.onerror = reject
		reader.readAsDataURL(file)
	})
}
