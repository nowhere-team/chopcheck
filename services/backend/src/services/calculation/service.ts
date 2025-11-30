import type { ParticipantWithSelections, SplitData } from '@/common/types'
import type { Logger } from '@/platform/logger'

import { StrategyFactory } from './strategy-factory'
import type { ItemCalculationResult, ParticipantTotal, SplitCalculationResult } from './types'

export class CalculationService {
	private factory = new StrategyFactory()

	constructor(private readonly logger: Logger) {}

	calculate(data: SplitData): SplitCalculationResult {
		this.logger.debug('calculating split', {
			splitId: data.split.id,
			items: data.items.length,
			participants: data.participants.length,
		})

		const itemResults: ItemCalculationResult[] = []

		for (const item of data.items) {
			const participations = data.participants.flatMap(p =>
				p.itemParticipations.filter(ip => ip.itemId === item.id),
			)

			for (const participation of participations) {
				const strategy = this.factory.getStrategy(participation.divisionMethod)
				const result = strategy.calculate({
					item,
					participation,
					allParticipations: participations,
					totalDiscount: data.split.totalDiscount || 0,
					totalDiscountPercent: data.split.totalDiscountPercent || '0',
				})

				itemResults.push({ ...result, participantId: participation.participantId })
			}
		}

		const participantTotals = this.aggregate(itemResults, data.participants)
		const splitTotal = data.items.reduce((sum, item) => sum + item.price, 0)
		const collected = participantTotals.reduce((sum, p) => sum + p.totalFinal, 0)

		return { itemResults, participantTotals, splitTotal, collected, difference: splitTotal - collected }
	}

	calculateForItems(data: SplitData, itemIds: string[]): ItemCalculationResult[] {
		const results: ItemCalculationResult[] = []
		const items = data.items.filter(i => itemIds.includes(i.id))

		for (const item of items) {
			const participations = data.participants.flatMap(p =>
				p.itemParticipations.filter(ip => ip.itemId === item.id),
			)

			for (const participation of participations) {
				const strategy = this.factory.getStrategy(participation.divisionMethod)
				const result = strategy.calculate({
					item,
					participation,
					allParticipations: participations,
					totalDiscount: data.split.totalDiscount || 0,
					totalDiscountPercent: data.split.totalDiscountPercent || '0',
				})

				results.push({ ...result, participantId: participation.participantId })
			}
		}

		return results
	}

	private aggregate(results: ItemCalculationResult[], participants: ParticipantWithSelections[]): ParticipantTotal[] {
		const totals = new Map<string, ParticipantTotal>(
			participants.map(p => [p.id, { participantId: p.id, totalBase: 0, totalDiscount: 0, totalFinal: 0 }]),
		)

		for (const r of results) {
			const t = totals.get(r.participantId)
			if (t) {
				t.totalBase += r.baseAmount
				t.totalDiscount += r.discountAmount
				t.totalFinal += r.finalAmount
			}
		}

		return Array.from(totals.values())
	}
}
