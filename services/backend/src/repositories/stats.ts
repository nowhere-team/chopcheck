import { and, count, eq, gte, sql } from 'drizzle-orm'

import { schema } from '@/platform/database'

import { BaseRepository } from './base'

export interface UserStatsData {
	totalJoinedSplits: number
	monthlySpent: number
}

export class StatsRepository extends BaseRepository {
	private getUserStatsCacheKey(userId: string): string {
		const currentMonth = new Date()
		const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}`
		return `user:${userId}:stats:${monthKey}`
	}

	async getUserStats(userId: string): Promise<UserStatsData> {
		return this.getOrSet(
			this.getUserStatsCacheKey(userId),
			async () => {
				const [totalJoinedSplits, monthlySpent] = await Promise.all([
					this.countUserJoinedSplits(userId),
					this.getUserMonthlySpent(userId),
				])

				return { totalJoinedSplits, monthlySpent }
			},
			600, // 10 minutes ttl
		)
	}

	private async countUserJoinedSplits(userId: string): Promise<number> {
		const result = await this.db
			.select({ count: count() })
			.from(schema.splitParticipants)
			.where(and(eq(schema.splitParticipants.userId, userId), eq(schema.splitParticipants.isDeleted, false)))

		return Number(result[0]?.count ?? 0)
	}

	private async getUserMonthlySpent(userId: string): Promise<number> {
		// get start of current calendar month
		const currentMonthStart = new Date()
		currentMonthStart.setDate(1)
		currentMonthStart.setHours(0, 0, 0, 0)

		const result = await this.db
			.select({
				total: sql<number>`COALESCE(SUM(${schema.splitItemParticipants.calculatedSum}), 0)`,
			})
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
					eq(schema.splitItemParticipants.isDeleted, false),
					eq(schema.splits.isDeleted, false),
					gte(schema.splits.createdAt, currentMonthStart),
				),
			)

		return Number(result[0]?.total ?? 0)
	}

	async invalidateUserStats(userId: string): Promise<void> {
		await this.cache.delete(this.getUserStatsCacheKey(userId))
		this.logger.debug('invalidated user stats cache', { userId })
	}
}
