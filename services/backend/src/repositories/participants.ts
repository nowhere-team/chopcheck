import { and, count, eq } from 'drizzle-orm'

import type { Participant, ParticipantWithSelections } from '@/common/types'
import { schema } from '@/platform/database'

import { BaseRepository } from './base'

interface ItemSelectionData {
	itemId: string
	divisionMethod: 'equal' | 'shares' | 'fixed' | 'proportional' | 'custom'
	value?: string
}

export class ParticipantsRepository extends BaseRepository {
	private getCacheKey(splitId: string, suffix: string = 'participants'): string {
		return `split:${splitId}:${suffix}`
	}

	async findBySplitId(splitId: string): Promise<ParticipantWithSelections[]> {
		return this.getOrSet(this.getCacheKey(splitId), async () => {
			const participants = await this.db.query.splitParticipants.findMany({
				where: and(
					eq(schema.splitParticipants.splitId, splitId),
					eq(schema.splitParticipants.isDeleted, false),
				),
				with: {
					user: {
						columns: {
							id: true,
							displayName: true,
							username: true,
							avatarUrl: true,
							isDeleted: true,
						},
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
		const participants = await this.db.query.splitParticipants.findFirst({
			where: and(
				eq(schema.splitParticipants.splitId, splitId),
				eq(schema.splitParticipants.userId, userId),
				eq(schema.splitParticipants.isDeleted, false),
			),
		})

		return participants || null
	}

	async join(
		splitId: string,
		userId: string,
		displayName?: string,
		isAnonymous: boolean = false,
	): Promise<Participant> {
		const existing = await this.findByUserAndSplit(userId, splitId)
		if (existing) {
			return existing
		}

		const [participant] = await this.db
			.insert(schema.splitParticipants)
			.values({
				splitId,
				userId,
				displayName,
				isReady: false,
				hasPaid: false,
				isAnonymous,
			})
			.returning()

		await this.cache.deletePattern(this.getCacheKey(splitId))

		return participant!
	}

	async addParticipant(splitId: string, userId: string | null, displayName?: string): Promise<Participant> {
		const [participant] = await this.db
			.insert(schema.splitParticipants)
			.values({ splitId, userId, displayName, isReady: false, hasPaid: false })
			.returning()

		await this.cache.deletePattern(this.getCacheKey(splitId))

		return participant!
	}

	async selectItems(participantId: string, splitId: string, selections: ItemSelectionData[]): Promise<void> {
		await this.db.transaction(async tx => {
			// remove old selections
			await tx
				.delete(schema.splitItemParticipants)
				.where(eq(schema.splitItemParticipants.participantId, participantId))

			// add new selections
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

		await this.cache.deletePattern(this.getCacheKey(splitId))
	}

	async countParticipants(splitId: string): Promise<number> {
		const result = await this.db
			.select({ count: count() })
			.from(schema.splitParticipants)
			.where(and(eq(schema.splitParticipants.splitId, splitId), eq(schema.splitParticipants.isDeleted, false)))

		return Number(result[0]?.count || 0)
	}

	async updateCalculatedSums(
		splitId: string,
		calculations: Array<{ participantId: string; itemId: string; calculatedSum: number }>,
	): Promise<void> {
		await this.db.transaction(async tx => {
			for (const calc of calculations) {
				await tx
					.update(schema.splitItemParticipants)
					.set({ calculatedSum: calc.calculatedSum })
					.where(
						and(
							eq(schema.splitItemParticipants.participantId, calc.participantId),
							eq(schema.splitItemParticipants.itemId, calc.itemId),
						),
					)
			}
		})

		await this.cache.deletePattern(this.getCacheKey(splitId))
	}
}
