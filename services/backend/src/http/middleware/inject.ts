import type { MiddlewareHandler } from 'hono'

import type { ExternalDependencies } from '@/http/types'

export function inject(deps: ExternalDependencies): MiddlewareHandler {
	return async (c, next) => {
		c.set('logger', deps.logger)
		c.set('auth', deps.auth)
		await next()
	}
}
