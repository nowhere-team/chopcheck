import { and, count, desc, eq, exists, gte, or, sql } from 'drizzle-orm'

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

	async findByUser(userId: string, offset: number = 0, limit: number = 50): Promise<Split[]> {
		return await this.db
			.select()
			.from(schema.splits)
			.where(
				and(
					eq(schema.splits.isDeleted, false),
					or(
						eq(schema.splits.ownerId, userId),
						exists(
							this.db
								.select({ id: schema.splitParticipants.id })
								.from(schema.splitParticipants)
								.where(
									and(
										eq(schema.splitParticipants.splitId, schema.splits.id),
										eq(schema.splitParticipants.userId, userId),
										eq(schema.splitParticipants.isDeleted, false),
									),
								),
						),
					),
				),
			)
			.orderBy(desc(schema.splits.updatedAt))
			.offset(offset)
			.limit(limit)
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

	async countUserSplits(userId: string): Promise<number> {
		const result = await this.db
			.select({ count: count() })
			.from(schema.splits)
			.where(
				and(
					eq(schema.splits.isDeleted, false),
					or(
						eq(schema.splits.ownerId, userId),
						exists(
							this.db
								.select({ id: schema.splitParticipants.id })
								.from(schema.splitParticipants)
								.where(
									and(
										eq(schema.splitParticipants.splitId, schema.splits.id),
										eq(schema.splitParticipants.userId, userId),
										eq(schema.splitParticipants.isDeleted, false),
									),
								),
						),
					),
				),
			)

		return Number(result[0]?.count ?? 0)
	}

	async getUserMonthlyTotal(userId: string): Promise<number> {
		const oneMonthAgo = new Date()
		oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

		const result = await this.db
			.select({
				totalAmount: sql<number>`COALESCE(SUM(${schema.splitItemParticipants.calculatedSum}), 0)`,
			})
			.from(schema.splitItemParticipants)
			.innerJoin(schema.splitParticipants, eq(schema.splitItemParticipants.participantId, schema.splitParticipants.id))
			.innerJoin(schema.splits, eq(schema.splitParticipants.splitId, schema.splits.id))
			.where(
				and(
					eq(schema.splitParticipants.userId, userId),
					eq(schema.splitItemParticipants.isDeleted, false),
					eq(schema.splitParticipants.isDeleted, false),
					eq(schema.splits.isDeleted, false),
					gte(schema.splits.createdAt, oneMonthAgo),
				),
			)

		return Number(result[0]?.totalAmount ?? 0)
	}
}
