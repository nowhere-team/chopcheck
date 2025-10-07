import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { inspectRoutes } from 'hono/dev'
import { trimTrailingSlash } from 'hono/trailing-slash'

import { errorHandler } from '@/http/middleware/errors'
import { inject } from '@/http/middleware/inject'
import { registerRoutes } from '@/http/routes'
import { AuthClient } from '@/platform/auth'
import type { Database } from '@/platform/database'
import type { Logger } from '@/platform/logger'
import type { Services } from '@/services'

export interface ServerConfig {
	port: number
	development: boolean
}

export function createRouter(logger: Logger, database: Database, auth: AuthClient, services: Services) {
	const app = new Hono()
		.basePath('/api')
		.use(cors())
		.use(trimTrailingSlash())
		.use(inject({ logger, auth, database, services }))
		.onError(errorHandler)
		.route('/', registerRoutes())

	const routes = inspectRoutes(app)
	logger.debug('routes registered', {
		count: routes.length,
		routes: routes
			.filter((r: { method: string; path: string }) => r.method !== 'ALL')
			.map(r => `${r.method} ${r.path}`),
	})

	return app
}

export interface Server {
	router: ReturnType<typeof createRouter>
	instance: Bun.Server
}

export function createServer(
	logger: Logger,
	database: Database,
	auth: AuthClient,
	services: Services,
	config: ServerConfig,
): Server {
	const router = createRouter(logger.named('http'), database, auth, services)

	const instance = Bun.serve({
		fetch: router.fetch,
		development: config.development,
		port: config.port,
	})

	return { router, instance }
}

// noinspection JSUnusedGlobalSymbols
export type ApiSpec = ReturnType<typeof createRouter> // used in hono/client
