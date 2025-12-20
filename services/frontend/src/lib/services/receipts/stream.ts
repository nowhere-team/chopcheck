import { getApiUrl } from '$lib/shared/constants'
import { createLogger } from '$lib/shared/logger'

const log = createLogger('receipt-stream')

export type ReceiptStreamEventType =
	| 'started'
	| 'fns_fetched'
	| 'item'
	| 'place'
	| 'receipt'
	| 'completed'
	| 'error'
	| 'stream_end'
	| 'ping'

export interface ReceiptStreamEvent {
	type: ReceiptStreamEventType
	data: any
}

export interface ReceiptCompleteData {
	receipt: {
		id: string
		total: number
		placeName?: string
	}
	items: any[]
	cached: boolean
}

export type StreamCallback = (event: ReceiptStreamEvent) => void

export async function streamReceiptFromQr(
	qrRaw: string,
	onEvent: StreamCallback,
	signal?: AbortSignal
): Promise<void> {
	const url = `${getApiUrl()}/receipts/scan/qr/stream`
	await openEventSource(url, { qrRaw }, onEvent, signal)
}

export async function streamReceiptFromImage(
	imageBase64: string,
	onEvent: StreamCallback,
	signal?: AbortSignal
): Promise<void> {
	const url = `${getApiUrl()}/receipts/scan/image/stream`
	await openEventSource(url, { image: imageBase64 }, onEvent, signal)
}

function extractEventData(type: string, raw: any): any {
	switch (type) {
		case 'item':
			return raw.item ?? raw
		case 'place':
			return raw.place ?? raw
		case 'receipt':
			return raw.receipt ?? raw
		default:
			return raw
	}
}

async function openEventSource(
	url: string,
	body: unknown,
	onEvent: StreamCallback,
	signal?: AbortSignal
) {
	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'text/event-stream'
			},
			body: JSON.stringify(body),
			credentials: 'include',
			signal
		})

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`)
		}

		const reader = response.body?.getReader()
		if (!reader) throw new Error('No response body')

		const decoder = new TextDecoder()
		let buffer = ''
		let currentEventType: string | null = null

		while (true) {
			const { done, value } = await reader.read()
			if (done) break

			buffer += decoder.decode(value, { stream: true })
			const lines = buffer.split('\n')
			buffer = lines.pop() || ''

			for (const line of lines) {
				const trimmed = line.trim()
				if (!trimmed) {
					currentEventType = null
					continue
				}

				if (trimmed.startsWith('event:')) {
					currentEventType = trimmed.slice(6).trim()
					continue
				}

				if (trimmed.startsWith('data:')) {
					const jsonStr = trimmed.slice(5).trim()
					if (!jsonStr) continue

					try {
						const parsed = JSON.parse(jsonStr)
						const eventType = currentEventType ?? parsed.type ?? 'unknown'

						if (eventType === 'ping') continue

						const eventData = extractEventData(eventType, parsed)
						onEvent({ type: eventType as ReceiptStreamEventType, data: eventData })
					} catch (e) {
						log.warn('failed to parse sse data', { line: trimmed, error: e })
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
	} finally {
		onEvent({ type: 'stream_end', data: {} })
	}
}

export function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => {
			const result = reader.result as string
			const base64 = result.split(',')[1]
			resolve(base64 || '')
		}
		reader.onerror = reject
		reader.readAsDataURL(file)
	})
}
