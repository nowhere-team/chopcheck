import type { Logger } from '@/platform/logger'
import type { SpanContext, Tracer } from '@/platform/tracing'

import type { CatalogClientConfig, EnrichRequest, EnrichResponse, StreamEvent } from './types'

export class CatalogClient {
	constructor(
		private readonly config: CatalogClientConfig,
		private readonly logger: Logger,
		private readonly tracer: Tracer,
	) {}

	async enrich(request: EnrichRequest, parentSpan?: SpanContext): Promise<EnrichResponse> {
		const span = parentSpan?.child('catalog.enrich') ?? this.tracer.startSpan('catalog.enrich')
		span.setAttribute('sourceType', request.source.type)

		try {
			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
			}
			this.tracer.injectFromContext(span.context, headers)

			const response = await fetch(`${this.config.serviceUrl}/enrich`, {
				method: 'POST',
				headers,
				body: JSON.stringify(request),
				signal: AbortSignal.timeout(this.config.requestTimeout),
			})

			if (!response.ok) {
				throw new Error(`catalog service error: ${response.status}`)
			}

			const result = (await response.json()) as EnrichResponse
			span.setAttribute('itemCount', result.items.length)
			span.setAttribute('cached', result.cached)
			span.end('ok')

			return result
		} catch (error) {
			span.setAttribute('error', true)
			span.end('error')
			throw error
		}
	}

	async *enrichStream(request: EnrichRequest, parentSpan?: SpanContext): AsyncGenerator<StreamEvent> {
		const span = parentSpan?.child('catalog.enrichStream') ?? this.tracer.startSpan('catalog.enrichStream')
		span.setAttribute('sourceType', request.source.type)

		try {
			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
				Accept: 'text/event-stream',
			}
			this.tracer.injectFromContext(span.context, headers)

			const response = await fetch(`${this.config.serviceUrl}/enrich/stream`, {
				method: 'POST',
				headers,
				body: JSON.stringify(request),
			})

			if (!response.ok) {
				throw new Error(`catalog service error: ${response.status}`)
			}

			if (!response.body) {
				throw new Error('no response body from catalog service')
			}

			const reader = response.body.getReader()
			const decoder = new TextDecoder()
			let buffer = ''

			while (true) {
				const { done, value } = await reader.read()

				if (done) break

				buffer += decoder.decode(value, { stream: true })

				const lines = buffer.split('\n')
				buffer = lines.pop() || ''

				for (const line of lines) {
					this.logger.debug('got line from catalog stream', { line })
					if (line.startsWith('event:')) {
						// todo what to do
						// const eventType = line.slice(6).trim()
						continue
					}

					if (line.startsWith('data:')) {
						const data = line.slice(5).trim()
						if (!data) continue

						try {
							const parsed = JSON.parse(data) as StreamEvent

							// skip pings
							if (parsed.type === 'ping') continue

							span.addEvent(`stream.${parsed.type}`)
							yield parsed
						} catch {
							this.logger.warn('failed to parse sse data', { data })
						}
					}
				}
			}

			span.end('ok')
		} catch (error) {
			span.setAttribute('error', true)
			span.end('error')
			throw error
		}
	}

	buildStructuredRequest(
		items: Array<{ name: string; quantity?: number; price?: number; sum?: number }>,
		place?: { name: string; address?: string; inn?: string },
		total?: number,
		date?: string,
	): EnrichRequest {
		return {
			type: 'receipt',
			source: {
				type: 'structured',
				data: { items, place, total, date },
			},
		}
	}

	buildImageRequest(base64: string): EnrichRequest {
		return {
			type: 'receipt',
			source: {
				type: 'image',
				data: base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`,
			},
		}
	}
}
