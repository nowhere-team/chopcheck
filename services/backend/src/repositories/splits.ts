import { and, desc, eq, exists, gte, or, sql } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'

import type { Split, SplitsByPeriod } from '@/common/types'
import { schema } from '@/platform/database'
import { generateSplitId } from '@/platform/database/utils/split-id-generator'

import { BaseRepository } from './base'

type CreateSplitData = Pick<Split, 'name' | 'currency'>

// custom alphabet without ambiguous characters (0, O, I, l, 1)
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz'

export class SplitsRepository extends BaseRepository {
	private nanoid = customAlphabet(alphabet, 8)

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

	async findByShortId(id: string): Promise<Split | null> {
		return this.getOrSet(this.getCacheKey(`short:${id}`), async () => {
			const split = await this.db.query.splits.findFirst({
				where: and(eq(schema.splits.shortId, id), eq(schema.splits.isDeleted, false)),
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

	async findByUserGroupedByPeriod(userId: string): Promise<SplitsByPeriod> {
		const now = new Date()

		// start of the week (monday)
		const startOfWeek = new Date(now)
		const day = startOfWeek.getDay()
		const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
		startOfWeek.setDate(diff)
		startOfWeek.setHours(0, 0, 0, 0)

		// start of the month
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
		startOfMonth.setHours(0, 0, 0, 0)

		// noinspection DuplicatedCode
		const baseConditions = [
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
		]

		const [thisWeek, thisMonth, earlier] = await Promise.all([
			// this week
			this.db
				.select()
				.from(schema.splits)
				.where(and(...baseConditions, gte(schema.splits.createdAt, startOfWeek)))
				.orderBy(desc(schema.splits.updatedAt)),

			// this month (but not this week)
			this.db
				.select()
				.from(schema.splits)
				.where(
					and(
						...baseConditions,
						gte(schema.splits.createdAt, startOfMonth),
						sql`${schema.splits.createdAt} < ${startOfWeek}`,
					),
				)
				.orderBy(desc(schema.splits.updatedAt)),

			// earlier (with the limit)
			this.db
				.select()
				.from(schema.splits)
				.where(and(...baseConditions, sql`${schema.splits.createdAt} < ${startOfMonth}`))
				.orderBy(desc(schema.splits.updatedAt))
				.limit(20),
		])

		return { thisWeek, thisMonth, earlier }
	}

	async findByUser(
		userId: string,
		options: {
			offset?: number
			limit?: number
			status?: 'draft' | 'active' | 'completed'
			before?: Date
		} = {},
	): Promise<Split[]> {
		const { offset = 0, limit = 20, status, before } = options

		// noinspection DuplicatedCode
		const conditions = [
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
		]

		if (status) {
			conditions.push(eq(schema.splits.status, status))
		}

		if (before) {
			conditions.push(sql`${schema.splits.createdAt} < ${before}`)
		}

		return await this.db
			.select()
			.from(schema.splits)
			.where(and(...conditions))
			.orderBy(desc(schema.splits.updatedAt))
			.offset(offset)
			.limit(limit)
	}

	async findDraftByUser(userId: string): Promise<Split | null> {
		const draft = await this.db.query.splits.findFirst({
			where: and(
				eq(schema.splits.ownerId, userId),
				eq(schema.splits.status, 'draft'),
				eq(schema.splits.isDeleted, false),
			),
			orderBy: (splits, { desc }) => [desc(splits.updatedAt)],
		})

		return draft || null
	}

	async create(ownerId: string, data: CreateSplitData): Promise<Split> {
		return await this.db.transaction(async tx => {
			const shortId = await generateSplitId(tx)

			const [split] = await tx
				.insert(schema.splits)
				.values({
					ownerId,
					shortId,
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
