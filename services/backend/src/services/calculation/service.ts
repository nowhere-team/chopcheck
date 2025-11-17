import type { ParticipantWithSelections } from '@/common/types'
import type { SplitData } from '@/common/types/splits'
import type { Logger } from '@/platform/logger'

import { StrategyFactory } from './strategy-factory'
import type { ItemCalculationResult } from './types'

export interface ParticipantCalculation {
	participantId: string
	displayName: string
	totalBaseAmount: number
	totalDiscountAmount: number
	totalAmount: number
	items: ItemCalculationResult[] // массив для удобства итерации
}

export interface CalculatedSplit extends SplitData {
	calculations: ParticipantCalculation[]
	totalSplitAmount: number
	totalCollected: number
	difference: number
}

export class CalculationService {
	private strategyFactory = new StrategyFactory()

	constructor(private logger: Logger) {}

	calculate(data: SplitData): CalculatedSplit {
		this.logger.debug('calculating split', {
			splitId: data.split.id,
			participantsCount: data.participants.length,
			itemsCount: data.items.length,
		})

		const calculations = data.participants.map(participant => this.calculateForParticipant(participant, data))

		const totalCollected = calculations.reduce((sum, calc) => sum + calc.totalAmount, 0)

		const totalSplitAmount = data.items.reduce((sum, item) => sum + item.price, 0)

		const difference = totalSplitAmount - totalCollected

		return {
			...data,
			calculations,
			totalSplitAmount,
			totalCollected,
			difference,
		}
	}

	private calculateForParticipant(participant: ParticipantWithSelections, data: SplitData): ParticipantCalculation {
		// take their choices (which items they selected)
		const selections = participant.itemParticipations

		const items = selections.map(selection => {
			const item = data.items.find(i => i.id === selection.itemId)
			if (!item) {
				this.logger.error('item not found for participation', {
					itemId: selection.itemId,
					participantId: participant.id,
				})
				throw new Error(`item ${selection.itemId} not found`)
			}

			// who else selected this item?
			const allParticipations = data.participants
				.flatMap(p => p.itemParticipations)
				.filter(ip => ip.itemId === item.id)

			// get a strategy using the division method
			const strategy = this.strategyFactory.getStrategy(selection.divisionMethod)

			return strategy.calculate({
				item,
				participation: selection,
				allParticipations,
				totalDiscount: data.split.totalDiscount || 0,
				totalDiscountPercent: data.split.totalDiscountPercent || '0',
			})
		})

		// summarize all the participant's items
		const totalBaseAmount = items.reduce((sum, i) => sum + i.baseAmount, 0)
		const totalDiscountAmount = items.reduce((sum, i) => sum + i.discountAmount, 0)
		const totalAmount = items.reduce((sum, i) => sum + i.finalAmount, 0)

		return {
			participantId: participant.id,
			displayName: participant.displayName || participant.user?.displayName || 'unknown',
			totalBaseAmount,
			totalDiscountAmount,
			totalAmount,
			items,
		}
	}
}
