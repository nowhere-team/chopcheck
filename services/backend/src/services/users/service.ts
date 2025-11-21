import { NotFoundError } from '@/common/errors'
import type { User } from '@/common/types'
import type { AuthClient } from '@/platform/auth'
import type { Logger } from '@/platform/logger'
import type { UsersRepository } from '@/repositories/users'

import type { TelegramUserData } from './types'

export class UsersService {
	constructor(
		private usersRepo: UsersRepository,
		private auth: AuthClient,
		private logger: Logger,
	) {}

	async getById(userId: string): Promise<User | null> {
		return await this.usersRepo.findById(userId)
	}

	async findOrCreateFromTelegram(telegramUser: TelegramUserData): Promise<User> {
		this.logger.debug('finding or creating user from telegram', {
			telegramId: telegramUser.id,
			username: telegramUser.username,
		})

		// step 1. search local user
		let localUser = await this.usersRepo.findByTelegramId(telegramUser.id)

		// step 2: save it to auth service
		let authUser = await this.auth.findUserByIntegration('telegram', telegramUser.id.toString())

		if (!authUser) {
			authUser = await this.auth.createUser({
				custom_display_name: telegramUser.firstName,
				integrations: [
					{
						type: 'telegram',
						external_id: telegramUser.id.toString(),
						external_data: {
							username: telegramUser.username,
							first_name: telegramUser.firstName,
							last_name: telegramUser.lastName,
							photo_url: telegramUser.photoUrl,
						},
						is_primary: true,
					},
				],
			})

			this.logger.debug('created user in auth service', {
				userId: authUser.user_id,
			})
		}

		// step 3: save or update local copy
		if (!localUser) {
			localUser = await this.usersRepo.create({
				id: authUser.user_id,
				telegramId: telegramUser.id,
				username: telegramUser.username,
				displayName: telegramUser.firstName || telegramUser.username || 'Anonymous',
				avatarUrl: telegramUser.photoUrl,
			})

			this.logger.debug('created local user', { userId: localUser.id })
		} else {
			await this.usersRepo.update(localUser.id, {
				displayName: telegramUser.firstName || localUser.displayName,
				avatarUrl: telegramUser.photoUrl || localUser.avatarUrl,
				lastSeenAt: new Date(),
			})

			this.logger.debug('updated existing user', { userId: localUser.id })
		}

		return localUser
	}

	async updatePreferences(userId: string, preferences: Record<string, unknown>): Promise<void> {
		this.logger.info('updating user preferences', { userId })

		const user = await this.usersRepo.findById(userId)
		if (!user) {
			throw new NotFoundError('user not found')
		}

		const updatedPreferences = {
			...((user.preferences as Record<string, unknown>) || {}),
			...preferences,
		}

		await this.usersRepo.updatePreferences(userId, updatedPreferences)
	}
}
