import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { inspectRoutes } from 'hono/dev'
import { trimTrailingSlash } from 'hono/trailing-slash'

import { errorHandler } from './middleware/errors'
import { inject } from './middleware/inject'
import { tracing } from './middleware/tracing'
import { registerRoutes } from './routes'
import type { ExternalDependencies, ServerConfig } from './types'

export function createRouter(deps: ExternalDependencies) {
	const app = new Hono()
		.basePath('/api')
		.use(cors())
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
