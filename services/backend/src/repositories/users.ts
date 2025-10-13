import { and, eq, isNull } from 'drizzle-orm'

import type { User } from '@/common/types'
import { schema } from '@/platform/database'

import { BaseRepository } from './base'

export class UsersRepository extends BaseRepository {
	private getCacheKey(id: string): string {
		return `user:${id}`
	}

	private getTelegramCacheKey(telegramId: number): string {
		return `user:telegram:${telegramId}`
	}

	async findById(id: string): Promise<User | null> {
		return this.getOrSet(this.getCacheKey(id), async () => {
			const user = await this.db.query.users.findFirst({
				where: and(eq(schema.users.id, id), eq(schema.users.isDeleted, false)),
			})
			return user || null
		})
	}

	async findByTelegramId(telegramId: number): Promise<User | null> {
		return this.getOrSet(this.getTelegramCacheKey(telegramId), async () => {
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

	async create(data: {
		id: string
		telegramId?: number
		username?: string
		displayName: string
		avatarUrl?: string
	}): Promise<User> {
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

		await this.invalidateCache(user!.id, user!.telegramId)

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

		await this.invalidateCache(id, user?.telegramId)
	}

	private async invalidateCache(userId: string, telegramId?: number | null): Promise<void> {
		await this.cache.delete(this.getCacheKey(userId))
		if (telegramId) {
			await this.cache.delete(this.getTelegramCacheKey(telegramId))
		}
	}
}
