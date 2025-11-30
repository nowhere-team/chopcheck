import { and, count, eq, gte, sql } from 'drizzle-orm'

import { schema } from '@/platform/database'

import { BaseRepository } from './base'

export interface UserStats {
	totalJoinedSplits: number
	monthlySpent: number
}

export class StatsRepository extends BaseRepository {
	async getUserStats(userId: string): Promise<UserStats> {
		const monthKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`
		const key = `user:${userId}:stats:${monthKey}`

		return this.cached(
			key,
			async () => {
				const [totalResult, monthlyResult] = await Promise.all([
					this.db
						.select({ count: count() })
						.from(schema.splitParticipants)
						.where(
							and(
								eq(schema.splitParticipants.userId, userId),
								eq(schema.splitParticipants.isDeleted, false),
							),
						),

					this.db
						.select({ total: sql<number>`COALESCE(SUM(${schema.splitItemParticipants.calculatedSum}), 0)` })
						.from(schema.splitItemParticipants)
						.innerJoin(
							schema.splitParticipants,
							eq(schema.splitItemParticipants.participantId, schema.splitParticipants.id),
						)
						.innerJoin(schema.splits, eq(schema.splitParticipants.splitId, schema.splits.id))
						.where(
							and(
								eq(schema.splitParticipants.userId, userId),
								eq(schema.splitParticipants.isDeleted, false),
								eq(schema.splits.isDeleted, false),
								gte(
									schema.splits.createdAt,
									new Date(new Date().getFullYear(), new Date().getMonth(), 1),
								),
							),
						),
				])

				return {
					totalJoinedSplits: Number(totalResult[0]?.count ?? 0),
					monthlySpent: Number(monthlyResult[0]?.total ?? 0),
				}
			},
			600,
		)
	}

	async invalidateUserStats(userId: string): Promise<void> {
		const monthKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`
		await this.invalidate(`user:${userId}:stats:${monthKey}`)
	}
}
