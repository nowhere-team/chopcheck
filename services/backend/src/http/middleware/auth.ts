import type { MiddlewareHandler } from 'hono'

import { ForbiddenError, UnauthorizedError } from '@/common/errors'

export function auth(): MiddlewareHandler {
	return async (c, next) => {
		const auth = c.get('auth')
		const logger = c.get('logger')
		const span = c.get('span')

		try {
			const authHeader = c.req.header('authorization')
			const token = auth.extractTokenFromHeader(authHeader)
			const authContext = await auth.validateToken(token)

			span?.setAttribute('user.id', authContext.userId)
			logger.debug('user authenticated', { userId: authContext.userId, tokenId: authContext.tokenId })

			c.set('authContext', authContext)
			await next()
		} catch (error) {
			logger.debug('authentication failed', { error })
			throw new UnauthorizedError('authentication failed')
		}
	}
}

export function requirePermission(permission: string): MiddlewareHandler {
	return async (c, next) => {
		const authContext = c.get('authContext')
		const logger = c.get('logger')

		if (!authContext) {
			throw new UnauthorizedError('authentication required')
		}

		if (!authContext.permissions.has(`cc:${permission}`)) {
			logger.warn('permission denied', {
				userId: authContext.userId,
				required: permission,
				available: Array.from(authContext.permissions),
			})
			throw new ForbiddenError(`permission required: ${permission}`)
		}

		logger.debug('permission granted', { userId: authContext.userId, permission })
		await next()
	}
}
