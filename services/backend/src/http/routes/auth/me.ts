import { Hono } from 'hono'

import { auth } from '@/http/middleware/auth'

export function createMeRoute() {
	return new Hono().get('/me', auth(), async c => {
		const authContext = c.get('authContext')!
		const user = await c.get('services').users.getById(authContext.userId)

		if (!user) return c.json({ error: 'user not found' }, 404)

		return c.json({
			id: user.id,
			username: user.username,
			display_name: user.displayName,
			avatar_url: user.avatarUrl,
			telegram_id: user.telegramId,
			preferences: user.preferences,
			created_at: user.createdAt,
		})
	})
}
