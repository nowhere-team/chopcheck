import type { MiddlewareHandler } from 'hono'

import type { ExternalDependencies } from '@/http/types'

export function inject(deps: ExternalDependencies): MiddlewareHandler {
	return async (c, next) => {
		c.set('logger', deps.logger)
		c.set('auth', deps.auth)
		c.set('services', deps.services)
		c.set('database', deps.database)
		c.set('telegram', deps.telegram)
		c.set('config', deps.config)
		await next()
	}
}
