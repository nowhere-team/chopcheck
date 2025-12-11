import type { ItemCalculationContext, ItemCalculationResult } from '../types'
import { DivisionStrategy } from './base'

export class EqualStrategy extends DivisionStrategy {
	calculate(ctx: ItemCalculationContext): Omit<ItemCalculationResult, 'participantId'> {
		const count = ctx.allParticipations.length
		if (count === 0) {
			return { itemId: ctx.item.id, baseAmount: 0, discountAmount: 0, finalAmount: 0, divisionMethod: 'equal' }
		}

		const baseAmount = Math.round(ctx.item.price / count)
		const { discountAmount, finalAmount } = this.applyDiscounts(baseAmount, ctx)

		return { itemId: ctx.item.id, baseAmount, discountAmount, finalAmount, divisionMethod: 'equal' }
	}
}
