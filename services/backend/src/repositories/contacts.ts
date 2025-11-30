import { and, count, eq, exists, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

import type { Contact, ContactsFilter } from '@/common/types'
import { schema } from '@/platform/database'

import { BaseRepository } from './base'

export class ContactsRepository extends BaseRepository {
	private key(userId: string) {
		return `user:${userId}:contacts`
	}

	async findByUserId(userId: string, filter: ContactsFilter = {}): Promise<Contact[]> {
		const all = await this.cached(this.key(userId), () => this.fetchAll(userId), 3600)

		let filtered = all.map(c => ({
			...c,
			lastInteraction: new Date(c.lastInteraction),
			firstInteraction: new Date(c.firstInteraction),
		}))

		if (filter.query) {
			const q = filter.query.toLowerCase()
			filtered = filtered.filter(
				c => c.displayName.toLowerCase().includes(q) || c.username?.toLowerCase().includes(q),
			)
		}

		switch (filter.sortBy) {
			case 'recent':
				filtered.sort((a, b) => b.lastInteraction.getTime() - a.lastInteraction.getTime())
				break
			case 'frequent':
				filtered.sort((a, b) => b.totalSplits - a.totalSplits)
				break
			case 'name':
				filtered.sort((a, b) => a.displayName.localeCompare(b.displayName))
				break
		}

		const offset = filter.offset || 0
		const limit = filter.limit || 50
		return filtered.slice(offset, offset + limit)
	}

	async getFinancialStats(userId: string, contactId: string): Promise<{ totalOwed: number; totalOwing: number }> {
		const key = `user:${userId}:contact:${contactId}:finance`

		return this.cached(
			key,
			async () => {
				const [owedResult, owingResult] = await Promise.all([
					this.db
						.select({ total: sql<number>`COALESCE(SUM(${schema.splitItemParticipants.calculatedSum}), 0)` })
						.from(schema.splitItemParticipants)
						.innerJoin(
							schema.splitParticipants,
							eq(schema.splitItemParticipants.participantId, schema.splitParticipants.id),
						)
						.innerJoin(
							schema.splits,
							and(
								eq(schema.splitParticipants.splitId, schema.splits.id),
								eq(schema.splits.ownerId, userId),
								eq(schema.splits.isDeleted, false),
							),
						)
						.where(
							and(
								eq(schema.splitParticipants.userId, contactId),
								eq(schema.splitParticipants.isDeleted, false),
								eq(schema.splitParticipants.hasPaid, false),
							),
						),

					this.db
						.select({ total: sql<number>`COALESCE(SUM(${schema.splitItemParticipants.calculatedSum}), 0)` })
						.from(schema.splitItemParticipants)
						.innerJoin(
							schema.splitParticipants,
							eq(schema.splitItemParticipants.participantId, schema.splitParticipants.id),
						)
						.innerJoin(
							schema.splits,
							and(
								eq(schema.splitParticipants.splitId, schema.splits.id),
								eq(schema.splits.ownerId, contactId),
								eq(schema.splits.isDeleted, false),
							),
						)
						.where(
							and(
								eq(schema.splitParticipants.userId, userId),
								eq(schema.splitParticipants.isDeleted, false),
								eq(schema.splitParticipants.hasPaid, false),
							),
						),
				])

				return {
					totalOwed: Number(owedResult[0]?.total ?? 0),
					totalOwing: Number(owingResult[0]?.total ?? 0),
				}
			},
			600,
		)
	}

	async invalidateUserContacts(userId: string): Promise<void> {
		await this.invalidate(this.key(userId))
	}

	private async fetchAll(userId: string): Promise<Contact[]> {
		const sp2 = alias(schema.splitParticipants, 'sp2')

		const results = await this.db
			.select({
				userId: schema.users.id,
				displayName: schema.users.displayName,
				username: schema.users.username,
				avatarUrl: schema.users.avatarUrl,
				isDeleted: schema.users.isDeleted,
				totalSplits: count(schema.splitParticipants.splitId).as('total_splits'),
				lastInteraction: sql<Date>`MAX(${schema.splitParticipants.joinedAt})`.as('last_interaction'),
				firstInteraction: sql<Date>`MIN(${schema.splitParticipants.joinedAt})`.as('first_interaction'),
			})
			.from(schema.splitParticipants)
			.innerJoin(schema.users, eq(schema.splitParticipants.userId, schema.users.id))
			.innerJoin(schema.splits, eq(schema.splitParticipants.splitId, schema.splits.id))
			.where(
				and(
					eq(schema.splitParticipants.isDeleted, false),
					eq(schema.splitParticipants.isAnonymous, false),
					eq(schema.splits.isDeleted, false),
					sql`${schema.splitParticipants.userId} != ${userId}`,
					exists(
						this.db
							.select({ id: sql`1` })
							.from(sp2)
							.where(
								and(
									eq(sp2.splitId, schema.splits.id),
									eq(sp2.userId, userId),
									eq(sp2.isDeleted, false),
								),
							),
					),
				),
			)
			.groupBy(
				schema.users.id,
				schema.users.displayName,
				schema.users.username,
				schema.users.avatarUrl,
				schema.users.isDeleted,
			)

		return results.map(r => ({
			userId: r.userId,
			displayName: r.displayName,
			username: r.username || undefined,
			avatarUrl: r.avatarUrl || undefined,
			isDeleted: r.isDeleted,
			totalSplits: Number(r.totalSplits),
			lastInteraction: r.lastInteraction,
			firstInteraction: r.firstInteraction,
		}))
	}
}
