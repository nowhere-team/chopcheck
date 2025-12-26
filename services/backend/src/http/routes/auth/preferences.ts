import { updatePreferencesSchema } from '@chopcheck/shared'
import { Hono } from 'hono'

import { auth } from '@/http/middleware/auth'
import { validate } from '@/http/utils'
import { toUserMeDto } from '@/http/utils/mappers'

export function createPreferencesRoute() {
	return new Hono().patch('/me/preferences', auth(), validate('json', updatePreferencesSchema), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const { preferences } = c.req.valid('json')

		await services.users.updatePreferences(authContext.userId, preferences)
		const user = await services.users.getById(authContext.userId)

		return c.json(toUserMeDto(user!))
	})
}
