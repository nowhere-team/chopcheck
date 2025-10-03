import { Hono } from 'hono'

import { auth, requirePermission } from '@/http/middleware/auth'

export function createSplitsRoutes() {
	return new Hono()
		.get('/public/:id', async c => {
			return c.json({ message: 'public data' })
		})
		.use('/*', auth())
		.get('/my', async c => {
			const authContext = c.get('authContext')!
			return c.json({
				userId: authContext.userId,
				permissions: Array.from(authContext.permissions),
			})
		})
		.post('/', requirePermission('splits:create'), async c => {
			return c.json({ message: 'split created' })
		})
}
