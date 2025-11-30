import { and, eq, isNull } from 'drizzle-orm'

import type { User } from '@/common/types'
import { schema } from '@/platform/database'

import { BaseRepository } from './base'

type NewUser = {
	id: string
	telegramId?: number
	username?: string
	displayName: string
	avatarUrl?: string
}

export class UsersRepository extends BaseRepository {
	private key(id: string) {
		return `user:${id}`
	}

	private telegramKey(telegramId: number) {
		return `user:tg:${telegramId}`
	}

	async findById(id: string): Promise<User | null> {
		return this.cached(this.key(id), async () => {
			const user = await this.db.query.users.findFirst({
				where: and(eq(schema.users.id, id), eq(schema.users.isDeleted, false)),
			})
			return user || null
		})
	}

	async findByTelegramId(telegramId: number): Promise<User | null> {
		return this.cached(this.telegramKey(telegramId), async () => {
			const user = await this.db.query.users.findFirst({
				where: and(eq(schema.users.telegramId, telegramId), eq(schema.users.isDeleted, false)),
			})
			return user || null
		})
	}

	async findByUsername(username: string): Promise<User | null> {
		const user = await this.db.query.users.findFirst({
			where: and(eq(schema.users.username, username), isNull(schema.users.telegramId)),
		})
		return user || null
	}

	async create(data: NewUser): Promise<User> {
		const [user] = await this.db
			.insert(schema.users)
			.values({
				id: data.id,
				telegramId: data.telegramId,
				username: data.username,
				displayName: data.displayName,
				avatarUrl: data.avatarUrl || '',
			})
			.returning()

		return user!
	}

	async update(
		id: string,
		data: Partial<Pick<User, 'telegramId' | 'displayName' | 'avatarUrl' | 'lastSeenAt'>>,
	): Promise<void> {
		const user = await this.findById(id)

		await this.db
			.update(schema.users)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(schema.users.id, id))

		await this.invalidate(this.key(id))
		if (user?.telegramId) {
			await this.invalidate(this.telegramKey(user.telegramId))
		}
	}

	async updatePreferences(id: string, preferences: Record<string, unknown>): Promise<void> {
		await this.db.update(schema.users).set({ preferences, updatedAt: new Date() }).where(eq(schema.users.id, id))

		await this.invalidate(this.key(id))
	}
}
