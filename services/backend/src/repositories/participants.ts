import { and, eq } from 'drizzle-orm'

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
				where: and(eq(schema.splitParticipants.splitId, splitId), eq(schema.splitParticipants.isDeleted, false)),
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

			// typescript теперь знает что itemParticipations есть
			return participants as ParticipantWithSelections[]
		})
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
			await tx.delete(schema.splitItemParticipants).where(eq(schema.splitItemParticipants.participantId, participantId))

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
}
