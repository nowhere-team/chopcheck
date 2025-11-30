import type { ItemCalculationContext, ItemCalculationResult } from '../types'
import { DivisionStrategy } from './base'

export class CustomStrategy extends DivisionStrategy {
	calculate(ctx: ItemCalculationContext): Omit<ItemCalculationResult, 'participantId'> {
		const finalAmount = ctx.participation.calculatedSum || 0

		return {
			itemId: ctx.item.id,
			baseAmount: finalAmount,
			discountAmount: 0,
			finalAmount,
			divisionMethod: 'custom',
		}
	}
}
