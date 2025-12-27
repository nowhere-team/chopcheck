import { Hono } from 'hono'

import { auth } from '@/http/middleware/auth'
import { toUserMeDto } from '@/http/utils/mappers'

export function createMeRoute() {
	return new Hono().get('/me', auth(), async c => {
		const authContext = c.get('authContext')!
		const user = await c.get('services').users.getById(authContext.userId)

		if (!user) return c.json({ error: 'user not found' }, 404)

		return c.json(toUserMeDto(user))
	})
}
