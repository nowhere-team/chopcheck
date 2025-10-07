import { and, eq } from 'drizzle-orm'

import type { Split } from '@/common/types'
import { schema } from '@/platform/database'

import { BaseRepository } from './base'

type CreateSplitData = Pick<Split, 'name' | 'currency'>

export class SplitsRepository extends BaseRepository {
	private getCacheKey(id: string, suffix: string = 'base'): string {
		return `split:${id}:${suffix}`
	}

	async findById(id: string): Promise<Split | null> {
		return this.getOrSet(this.getCacheKey(id), async () => {
			const split = await this.db.query.splits.findFirst({
				where: and(eq(schema.splits.id, id), eq(schema.splits.isDeleted, false)),
				with: {
					owner: {
						columns: {
							id: true,
							displayName: true,
							username: true,
							avatarUrl: true,
							isDeleted: true,
						},
					},
				},
			})

			return split || null
		})
	}

	async create(ownerId: string, data: CreateSplitData): Promise<Split> {
		return await this.db.transaction(async tx => {
			const [split] = await tx
				.insert(schema.splits)
				.values({
					ownerId,
					name: data.name,
					currency: data.currency || 'RUB',
					status: 'draft',
					phase: 'setup',
				})
				.returning()

			await tx.insert(schema.splitParticipants).values({
				splitId: split!.id,
				userId: ownerId,
				isReady: false,
				hasPaid: false,
			})

			return split!
		})
	}

	async update(id: string, data: Partial<Split>): Promise<void> {
		await this.db
			.update(schema.splits)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(schema.splits.id, id))

		await this.cache.delete(this.getCacheKey(id))
	}
}
