import { and, desc, eq, exists, gte, or, sql } from 'drizzle-orm'

import type { Split, SplitsByPeriod } from '@/common/types'
import { schema } from '@/platform/database'
import { generateSplitId } from '@/platform/database/utils'

import { BaseRepository } from './base'

type NewSplit = Pick<Split, 'name' | 'currency'> & { icon?: string }

export class SplitsRepository extends BaseRepository {
	private key(id: string) {
		return `split:${id}`
	}

	async findById(id: string): Promise<Split | null> {
		return this.cached(this.key(id), async () => {
			const split = await this.db.query.splits.findFirst({
				where: and(eq(schema.splits.id, id), eq(schema.splits.isDeleted, false)),
			})
			return split || null
		})
	}

	async findByShortId(shortId: string): Promise<Split | null> {
		return this.cached(`split:short:${shortId}`, async () => {
			const split = await this.db.query.splits.findFirst({
				where: and(eq(schema.splits.shortId, shortId), eq(schema.splits.isDeleted, false)),
			})
			return split || null
		})
	}

	async findByUserGroupedByPeriod(userId: string): Promise<SplitsByPeriod> {
		const now = new Date()

		const startOfWeek = new Date(now)
		const day = startOfWeek.getDay()
		const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
		startOfWeek.setDate(diff)
		startOfWeek.setHours(0, 0, 0, 0)

		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

		const baseConditions = this.userSplitsCondition(userId)

		const [thisWeek, thisMonth, earlier] = await Promise.all([
			this.db
				.select()
				.from(schema.splits)
				.where(and(...baseConditions, gte(schema.splits.createdAt, startOfWeek)))
				.orderBy(desc(schema.splits.updatedAt)),

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
		options: { offset?: number; limit?: number; status?: Split['status']; before?: Date } = {},
	): Promise<Split[]> {
		const { offset = 0, limit = 20, status, before } = options
		const conditions = this.userSplitsCondition(userId)

		if (status) conditions.push(eq(schema.splits.status, status))
		if (before) conditions.push(sql`${schema.splits.createdAt} < ${before}`)

		return this.db
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
			orderBy: (s, { desc }) => [desc(s.updatedAt)],
		})
		return draft || null
	}

	async create(ownerId: string, data: NewSplit): Promise<Split> {
		return this.db.transaction(async tx => {
			const shortId = await generateSplitId(tx)

			const [split] = await tx
				.insert(schema.splits)
				.values({
					ownerId,
					shortId,
					name: data.name,
					currency: data.currency || 'RUB',
					icon: data.icon,
					status: 'draft',
					phase: 'setup',
				})
				.returning()

			await tx.insert(schema.splitParticipants).values({
				splitId: split!.id,
				userId: ownerId,
			})

			return split!
		})
	}

	async update(id: string, data: Partial<Split>): Promise<void> {
		await this.db
			.update(schema.splits)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(schema.splits.id, id))

		await this.invalidate(this.key(id))
	}

	async getReceiptIds(splitId: string): Promise<string[]> {
		const rows = await this.db.query.splitReceipts.findMany({
			where: eq(schema.splitReceipts.splitId, splitId),
			orderBy: (sr, { asc }) => [asc(sr.displayOrder)],
		})
		return rows.map(r => r.receiptId)
	}

	async linkReceipt(splitId: string, receiptId: string): Promise<void> {
		await this.db.insert(schema.splitReceipts).values({ splitId, receiptId }).onConflictDoNothing()
		await this.invalidate(this.key(splitId))
	}

	async unlinkReceipt(splitId: string, receiptId: string): Promise<void> {
		await this.db
			.delete(schema.splitReceipts)
			.where(and(eq(schema.splitReceipts.splitId, splitId), eq(schema.splitReceipts.receiptId, receiptId)))
		await this.invalidate(this.key(splitId))
	}

	private userSplitsCondition(userId: string) {
		return [
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
	}
}
