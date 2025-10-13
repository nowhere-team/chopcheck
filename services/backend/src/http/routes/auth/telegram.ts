import { parse, validate } from '@tma.js/init-data-node'
import { Hono } from 'hono'
import { z } from 'zod'

import { validate as validateSchema } from '@/http/utils'

const telegramAuthSchema = z.object({
	initData: z.string().nonempty(),
})
export function createTelegramAuthRoute() {
	return new Hono().post('/telegram', validateSchema('json', telegramAuthSchema), async c => {
		const { initData } = c.req.valid('json')
		const auth = c.get('auth')
		const logger = c.get('logger')
		const services = c.get('services')
		const config = c.get('config')

		// step 1. validate sign
		try {
			validate(initData, config.telegramToken, {
				expiresIn: 3600, // 1 hour
			})
		} catch (err) {
			logger.warn('invalid telegram init data', { error: err })
			return c.json({ error: 'invalid init data' }, 401)
		}

		// step 2. parse init data
		const data = parse(initData)

		// step 3. extract user info
		if (!data.user) {
			return c.json({ error: 'user data not found' }, 400)
		}

		const { id, username, first_name: firstName, photo_url: photoUrl } = data.user
		logger.debug('telegram auth', { id, username })

		// step 4. find or create user (вся логика в сервисе)
		const user = await services.users.findOrCreateFromTelegram({
			id,
			username,
			firstName,
			photoUrl,
		})

		// step 5. create token
		const token = await auth.createToken({
			user_id: user.id,
			requested_by: 'chopcheck',
			permissions: ['cc:splits:read', 'cc:splits:write', 'cc:splits:create'],
			client_info: {
				user_agent: c.req.header('user-agent'),
				platform: 'telegram',
			},
		})

		return c.json({
			accessToken: token.access_token,
			user: {
				id: user.id,
				displayName: user.displayName,
				username: user.username,
				avatarUrl: user.avatarUrl,
			},
		})
	})
}
