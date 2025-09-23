import type { MiddlewareHandler } from 'hono'

export function auth(): MiddlewareHandler {
	return async (c, next) => {
		// todo: uncomment when jwt added
		// const jwt = c.get('jwt')
		//
		// try {
		// 	const authHeader = c.req.header('authorization')
		// 	const token = jwt.extractTokenFromHeader(authHeader)
		// 	const authContext = await jwt.validateToken(token)
		//
		// 	c.set('auth', authContext)
		// 	await next()
		// } catch (error) {
		// 	if (error instanceof UnauthorizedError) {
		// 		throw error
		// 	}
		// 	throw new UnauthorizedError('authentication failed')
		// }
	}
}

export function requirePermission(permission: string): MiddlewareHandler {
	return async (c, next) => {
		// todo: uncomment when auth module added
		// const auth = c.get('auth')
		// if (!auth) {
		// 	throw new UnauthorizedError('authentication required')
		// }
		//
		// if (!auth.permissions.has(permission)) {
		// 	throw new UnauthorizedError(`permission required: ${permission}`)
		// }
		//
		// await next()
	}
}
