import { and, count, eq } from 'drizzle-orm'

import type { Participant, ParticipantWithSelections } from '@/common/types'
import { schema } from '@/platform/database'

import { BaseRepository } from './base'

interface SelectionInput {
	itemId: string
	divisionMethod: 'equal' | 'shares' | 'fixed' | 'proportional' | 'custom'
	value?: string
}

interface CalculationUpdate {
	participantId: string
	itemId: string
	calculatedBase: number
	calculatedDiscount: number
	calculatedSum: number
}

export class ParticipantsRepository extends BaseRepository {
	private key(splitId: string) {
		return `split:${splitId}:participants`
	}

	async findBySplitId(splitId: string): Promise<ParticipantWithSelections[]> {
		return this.cached(this.key(splitId), async () => {
			const participants = await this.db.query.splitParticipants.findMany({
				where: and(
					eq(schema.splitParticipants.splitId, splitId),
					eq(schema.splitParticipants.isDeleted, false),
				),
				with: {
					user: {
						columns: { id: true, displayName: true, username: true, avatarUrl: true, isDeleted: true },
					},
					itemParticipations: {
						where: eq(schema.splitItemParticipants.isDeleted, false),
					},
				},
			})
			return participants as ParticipantWithSelections[]
		})
	}

	async findByUserAndSplit(userId: string, splitId: string): Promise<Participant | null> {
		const participant = await this.db.query.splitParticipants.findFirst({
			where: and(
				eq(schema.splitParticipants.splitId, splitId),
				eq(schema.splitParticipants.userId, userId),
				eq(schema.splitParticipants.isDeleted, false),
			),
		})
		return participant || null
	}

	async join(
		splitId: string,
		userId: string,
		displayName?: string,
		isAnonymous: boolean = false,
	): Promise<Participant> {
		const existing = await this.findByUserAndSplit(userId, splitId)

		if (existing) {
			await this.db
				.update(schema.splitParticipants)
				.set({ isAnonymous, displayName: displayName || existing.displayName })
				.where(eq(schema.splitParticipants.id, existing.id))

			await this.invalidate(this.key(splitId))
			return existing
		}

		const [participant] = await this.db
			.insert(schema.splitParticipants)
			.values({ splitId, userId, displayName, isAnonymous })
			.returning()

		await this.invalidate(this.key(splitId))
		return participant!
	}

	async selectItems(participantId: string, splitId: string, selections: SelectionInput[]): Promise<void> {
		await this.db.transaction(async tx => {
			await tx
				.delete(schema.splitItemParticipants)
				.where(eq(schema.splitItemParticipants.participantId, participantId))

			if (selections.length > 0) {
				await tx.insert(schema.splitItemParticipants).values(
					selections.map(s => ({
						participantId,
						itemId: s.itemId,
						divisionMethod: s.divisionMethod,
						participationValue: s.value,
						applyTotalDiscount: true,
					})),
				)
			}
		})

		await this.invalidate(this.key(splitId))
	}

	async updateCalculations(splitId: string, updates: CalculationUpdate[]): Promise<void> {
		await this.db.transaction(async tx => {
			for (const u of updates) {
				await tx
					.update(schema.splitItemParticipants)
					.set({
						calculatedBase: u.calculatedBase,
						calculatedDiscount: u.calculatedDiscount,
						calculatedSum: u.calculatedSum,
					})
					.where(
						and(
							eq(schema.splitItemParticipants.participantId, u.participantId),
							eq(schema.splitItemParticipants.itemId, u.itemId),
						),
					)
			}
		})

		await this.invalidate(this.key(splitId))
	}

	async updateParticipantTotal(participantId: string, splitId: string, total: number): Promise<void> {
		await this.db
			.update(schema.splitParticipants)
			.set({ cachedTotal: total })
			.where(eq(schema.splitParticipants.id, participantId))
		await this.invalidate(this.key(splitId))
	}

	async countParticipants(splitId: string): Promise<number> {
		const result = await this.db
			.select({ count: count() })
			.from(schema.splitParticipants)
			.where(and(eq(schema.splitParticipants.splitId, splitId), eq(schema.splitParticipants.isDeleted, false)))

		return Number(result[0]?.count || 0)
	}

	async invalidateCache(splitId: string): Promise<void> {
		await this.invalidate(this.key(splitId))
	}
}
