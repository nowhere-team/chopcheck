import { Hono } from 'hono'

import { auth } from '@/http/middleware/auth'

export function createStatsRoute() {
	return new Hono().get('/me/stats', auth(), async c => {
		const authContext = c.get('authContext')!
		return c.json(await c.get('services').splits.getUserStats(authContext.userId))
	})
}
