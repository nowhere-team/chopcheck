import type { MiddlewareHandler } from 'hono'

import type { ExternalDependencies } from '@/http/types'

export function inject(deps: ExternalDependencies): MiddlewareHandler {
	return async (c, next) => {
		c.set('logger', deps.logger)
		c.set('tracer', deps.tracer)
		c.set('auth', deps.auth)
		c.set('services', deps.services)
		c.set('database', deps.database)
		c.set('telegram', deps.telegram)
		c.set('fns', deps.fns)
		c.set('catalog', deps.catalog)
		c.set('config', deps.config)
		await next()
	}
}
