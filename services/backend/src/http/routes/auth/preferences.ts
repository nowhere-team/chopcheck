import { Hono } from 'hono'
import { z } from 'zod'

import { auth } from '@/http/middleware/auth'
import { validate } from '@/http/utils'

const schema = z.object({ preferences: z.record(z.string(), z.unknown()) })

export function createPreferencesRoute() {
	return new Hono().patch('/me/preferences', auth(), validate('json', schema), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const { preferences } = c.req.valid('json')

		await services.users.updatePreferences(authContext.userId, preferences)
		const user = await services.users.getById(authContext.userId)

		return c.json({
			id: user!.id,
			username: user!.username,
			display_name: user!.displayName,
			avatar_url: user!.avatarUrl,
			telegram_id: user!.telegramId,
			preferences: user!.preferences,
			created_at: user!.createdAt,
		})
	})
}
