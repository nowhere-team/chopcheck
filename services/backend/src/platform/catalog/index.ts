import { CatalogClient } from '@nowhere-team/catalog'

import type { Logger } from '@/platform/logger'
import type { Tracer } from '@/platform/tracing'

export interface CatalogServiceConfig {
	baseUrl: string
	timeout?: number
	maxImagesPerRequest?: number
}

export function createCatalogClient(config: CatalogServiceConfig, logger: Logger, tracer: Tracer): CatalogClient {
	const catalogLogger = logger.named('catalog')

	return new CatalogClient({
		baseUrl: config.baseUrl,
		timeout: config.timeout,
		onRequest: async request => {
			const span = tracer.startSpan('catalog.request', {
				'http.method': request.method,
				'http.url': request.url,
			})

			const headers = new Headers(request.headers)
			tracer.injectFromContext(span.context, Object.fromEntries(headers.entries()))

			catalogLogger.debug('catalog request', { method: request.method, url: request.url })

			return new Request(request, { headers })
		},
		onError: error => {
			catalogLogger.warn('catalog error', {
				message: error.message,
				code: error.code,
				status: error.status,
			})
		},
	})
}

export { CatalogClient, CatalogError, consumeStream, parseSSEStream } from '@nowhere-team/catalog'
export type * from '@nowhere-team/catalog/types'
