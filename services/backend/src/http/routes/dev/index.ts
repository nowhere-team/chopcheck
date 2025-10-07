// services/backend/src/http/routes/dev/index.ts
import { and, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'

import { schema } from '@/platform/database'

export function createDevRoutes() {
	return new Hono().post('/telegram', async c => {
		const auth = c.get('auth')
		const db = c.get('database')
		const logger = c.get('logger')

		const { telegram_id, username, first_name, photo_url } = await c.req.json()

		logger.debug('dev telegram auth', { telegram_id, username })

		let localUser = await db.query.users.findFirst({
			where: eq(schema.users.telegramId, telegram_id),
		})

		if (!localUser && username) {
			localUser = await db.query.users.findFirst({
				where: and(eq(schema.users.username, username), isNull(schema.users.telegramId)),
			})

			if (localUser) {
				await db
					.update(schema.users)
					.set({
						telegramId: telegram_id,
						displayName: first_name || localUser.displayName,
						avatarUrl: photo_url || localUser.avatarUrl,
						updatedAt: new Date(),
					})
					.where(eq(schema.users.id, localUser.id))

				logger.info('migrated old user', {
					userId: localUser.id,
					telegram_id,
				})
			}
		}

		let authUser = await auth.findUserByIntegration('telegram', telegram_id.toString())

		if (!authUser) {
			authUser = await auth.createUser({
				custom_display_name: first_name,
				integrations: [
					{
						type: 'telegram',
						external_id: telegram_id.toString(),
						external_data: { username, first_name, photo_url },
						is_primary: true,
					},
				],
			})
			logger.debug('created user in auth mock', { userId: authUser.user_id })
		}

		if (!localUser) {
			await db.insert(schema.users).values({
				id: authUser.user_id,
				telegramId: telegram_id,
				username: username,
				displayName: first_name || username || 'аноним',
				avatarUrl: photo_url || '',
			})

			localUser = await db.query.users.findFirst({
				where: eq(schema.users.id, authUser.user_id),
			})

			logger.debug('created user in local db', { userId: authUser.user_id })
		} else {
			await db
				.update(schema.users)
				.set({
					displayName: first_name || localUser.displayName,
					avatarUrl: photo_url || localUser.avatarUrl,
					lastSeenAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(schema.users.id, localUser.id))

			logger.debug('updated existing user', { userId: localUser.id })
		}

		const token = await auth.createToken({
			user_id: localUser!.id,
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
				id: localUser!.id,
				display_name: localUser!.displayName,
				avatar_url: localUser!.avatarUrl,
			},
		})
	})
}
