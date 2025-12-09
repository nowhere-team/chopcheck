import type { MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'

import { ForbiddenError, UnauthorizedError } from '@/common/errors'

function extractToken(c: any): string | null {
	const cookieToken = getCookie(c, 'access_token')
	if (cookieToken) return cookieToken

	const authHeader = c.req.header('authorization')
	if (!authHeader) return null

	const parts = authHeader.split(' ')
	if (parts.length !== 2 || parts[0] !== 'Bearer') return null

	return parts[1]
}

export function auth(): MiddlewareHandler {
	return async (c, next) => {
		const auth = c.get('auth')
		const logger = c.get('logger')
		const span = c.get('span')

		try {
			const token = extractToken(c)
			if (!token) throw new UnauthorizedError('token not provided')

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
