import type { ImageMetadata, Receipt, ReceiptItem, SavedImageInfo } from '$lib/services/api/types'
import { getApiUrl } from '$lib/shared/constants'
import { createLogger } from '$lib/shared/logger'

const log = createLogger('receipt-stream')

export type ReceiptStreamEventType =
	| 'started'
	| 'fns_fetched'
	| 'image_meta'
	| 'item'
	| 'place'
	| 'receipt'
	| 'language'
	| 'warning'
	| 'completed'
	| 'error'
	| 'stream_end'
	| 'ping'

export interface ReceiptStreamEvent {
	type: ReceiptStreamEventType
	data: unknown
}

export interface ReceiptCompleteData {
	receipt: Receipt
	items: ReceiptItem[]
	images?: ImageMetadata[]
	savedImages?: SavedImageInfo[]
	cached: boolean
}

export interface ImageMetaEventData {
	image: ImageMetadata
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

export async function streamReceiptFromImages(
	images: string[],
	onEvent: StreamCallback,
	options?: { saveImages?: boolean },
	signal?: AbortSignal
): Promise<void> {
	const url = `${getApiUrl()}/receipts/scan/image/stream`
	await openEventSource(url, { images, saveImages: options?.saveImages }, onEvent, signal)
}

// backwards compatibility
export async function streamReceiptFromImage(
	imageBase64: string,
	onEvent: StreamCallback,
	signal?: AbortSignal
): Promise<void> {
	return streamReceiptFromImages([imageBase64], onEvent, undefined, signal)
}

function extractEventData(type: string, raw: unknown): unknown {
	const data = raw as Record<string, unknown>
	switch (type) {
		case 'item':
			return data.item ?? data
		case 'place':
			return data.place ?? data
		case 'receipt':
			return data.receipt ?? data
		case 'image_meta':
			return data.image ?? data
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
						const eventType =
							currentEventType ?? (parsed as { type?: string }).type ?? 'unknown'

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

export function filesToBase64(files: File[]): Promise<string[]> {
	return Promise.all(files.map(fileToBase64))
}
