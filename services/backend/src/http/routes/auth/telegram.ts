import { telegramAuthSchema } from '@chopcheck/shared'
import { parse, validate } from '@tma.js/init-data-node'
import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'

import { validate as v } from '@/http/utils'

export function createTelegramAuthRoute() {
	return new Hono().post('/telegram', v('json', telegramAuthSchema), async c => {
		const { initData } = c.req.valid('json')
		const auth = c.get('auth')
		const services = c.get('services')
		const config = c.get('config')
		const logger = c.get('logger')

		try {
			validate(initData, config.telegramToken, { expiresIn: 3600 })
		} catch {
			return c.json({ error: 'invalid init data' }, 401)
		}

		const data = parse(initData)
		if (!data.user) return c.json({ error: 'user data not found' }, 400)

		const { id, username, first_name, photo_url } = data.user
		logger.debug('telegram auth', { id, username })

		const user = await services.users.findOrCreateFromTelegram({
			id,
			username,
			firstName: first_name,
			photoUrl: photo_url,
		})

		const token = await auth.createToken({
			user_id: user.id,
			requested_by: 'chopcheck',
			permissions: ['cc:splits:read', 'cc:splits:write', 'cc:splits:create'],
			client_info: { user_agent: c.req.header('user-agent'), platform: 'telegram' },
		})

		setCookie(c, 'access_token', token.access_token, {
			httpOnly: true,
			secure: !config.development,
			sameSite: config.development ? 'Lax' : 'Strict',
			maxAge: 7 * 24 * 60 * 60,
			path: '/',
		})

		return c.json({
			accessToken: token.access_token,
			user: { id: user.id, displayName: user.displayName, username: user.username, avatarUrl: user.avatarUrl },
		})
	})
}
