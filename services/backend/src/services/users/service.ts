import { NotFoundError } from '@/common/errors'
import type { User } from '@/common/types'
import type { AuthClient } from '@/platform/auth'
import type { Logger } from '@/platform/logger'
import type { UsersRepository } from '@/repositories'

import type { TelegramUserData } from './types'

export class UsersService {
	constructor(
		private readonly repo: UsersRepository,
		private readonly auth: AuthClient,
		private readonly logger: Logger,
	) {}

	async getById(userId: string): Promise<User | null> {
		return this.repo.findById(userId)
	}

	async findOrCreateFromTelegram(data: TelegramUserData): Promise<User> {
		this.logger.debug('finding or creating user from telegram', { telegramId: data.id })

		let localUser = await this.repo.findByTelegramId(data.id)
		let authUser = await this.auth.findUserByIntegration('telegram', data.id.toString())

		if (!authUser) {
			authUser = await this.auth.createUser({
				custom_display_name: data.firstName,
				integrations: [
					{
						type: 'telegram',
						external_id: data.id.toString(),
						external_data: {
							username: data.username,
							first_name: data.firstName,
							last_name: data.lastName,
							photo_url: data.photoUrl,
						},
						is_primary: true,
					},
				],
			})
			this.logger.debug('created user in auth service', { userId: authUser.user_id })
		}

		if (!localUser) {
			localUser = await this.repo.create({
				id: authUser.user_id,
				telegramId: data.id,
				username: data.username,
				displayName: data.firstName || data.username || 'Anonymous',
				avatarUrl: data.photoUrl,
			})
			this.logger.debug('created local user', { userId: localUser.id })
		} else {
			await this.repo.update(localUser.id, {
				displayName: data.firstName || localUser.displayName,
				avatarUrl: data.photoUrl || localUser.avatarUrl,
				lastSeenAt: new Date(),
			})
		}

		return localUser
	}

	async updatePreferences(userId: string, preferences: Record<string, unknown>): Promise<void> {
		const user = await this.repo.findById(userId)
		if (!user) throw new NotFoundError('user not found')

		const merged = { ...((user.preferences as Record<string, unknown>) || {}), ...preferences }
		await this.repo.updatePreferences(userId, merged)
	}
}
