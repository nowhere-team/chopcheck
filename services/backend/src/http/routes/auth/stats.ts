import { Hono } from 'hono'

import { auth } from '@/http/middleware/auth'

export function createStatsRoute() {
	return new Hono().get('/me/stats', auth(), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')

		try {
			return c.json(await services.splits.getUserStats(authContext.userId))
		} catch (error) {
			c.get('logger').error('failed to get user stats', { error, userId: authContext.userId })
			return c.json({ error: 'failed to retrieve statistics' }, 500)
		}
	})
}
