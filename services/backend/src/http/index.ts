// services/backend/src/http/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { inspectRoutes } from 'hono/dev'
import { trimTrailingSlash } from 'hono/trailing-slash'

import { errorHandler } from './middleware/errors'
import { inject } from './middleware/inject'
import { tracing } from './middleware/tracing'
import { registerRoutes } from './routes'
import type { ExternalDependencies, ServerConfig } from './types'

function isLocalNetworkOrigin(origin: string): boolean {
	if (!origin) return false

	const url = new URL(origin)
	const hostname = url.hostname

	if (hostname === 'localhost' || hostname === '127.0.0.1') return true

	if (hostname.startsWith('192.168.')) return true
	if (hostname.startsWith('10.')) return true
	if (hostname.startsWith('172.')) {
		const second = parseInt(hostname.split('.')[1] || '0', 10)
		if (second >= 16 && second <= 31) return true
	}

	return false
}

export function createRouter(deps: ExternalDependencies) {
	const isDev = deps.config.development

	const app = new Hono()
		.basePath('/api')
		.use(
			cors({
				origin: origin => {
					if (!origin) return null

					if (isDev && isLocalNetworkOrigin(origin)) {
						return origin
					}

					if (!isDev && origin.includes('chopcheck.app')) {
						return origin
					}

					return null
				},
				credentials: true,
				allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
				allowHeaders: ['Content-Type', 'Authorization'],
				exposeHeaders: ['Content-Length'],
				maxAge: 600,
			}),
		)
		.use(trimTrailingSlash())
		.use(inject(deps))
		.use(tracing(deps.tracer))
		.onError(errorHandler)
		.route('/', registerRoutes())

	deps.logger.debug('routes registered', { count: inspectRoutes(app).filter(r => r.method !== 'ALL').length })

	return app
}

export function createServer(deps: ExternalDependencies, config: ServerConfig) {
	const router = createRouter(deps)
	const instance = Bun.serve({ fetch: router.fetch, development: config.development, port: config.port })
	return { router, instance }
}

export type ApiSpec = ReturnType<typeof createRouter>
