import { Hono } from 'hono'

export function createDevRoutes() {
	return new Hono().post('/telegram', async c => {
		const auth = c.get('auth')
		const { telegram_id, username, first_name, photo_url } = await c.req.json()

		let user = await auth.findUserByIntegration('telegram', telegram_id)

		if (!user) {
			user = await auth.createUser({
				integrations: [
					{
						type: 'telegram',
						external_id: telegram_id,
						external_data: { username, first_name, photo_url },
						is_primary: true,
					},
				],
			})
		}

		const token = await auth.createToken({
			user_id: user.user_id,
			requested_by: 'chopcheck',
			permissions: ['cc:splits:read', 'cc:splits:write', 'cc:splits:create'],
			client_info: {
				user_agent: c.req.header('user-agent'),
				platform: 'telegram',
			},
		})

		return c.json({
			access_token: token.access_token,
			user: {
				id: user.user_id,
				display_name: user.display_name,
				avatar_url: user.avatar_url,
			},
		})
	})
}
