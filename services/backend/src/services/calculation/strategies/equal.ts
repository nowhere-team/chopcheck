import type { ItemCalculationContext, ItemCalculationResult } from '../types'
import { DivisionStrategy } from './base'

export class EqualDivisionStrategy extends DivisionStrategy {
	override calculate(ctx: ItemCalculationContext): ItemCalculationResult {
		const participantsCount = ctx.allParticipations.length

		if (participantsCount === 0) {
			return {
				itemId: ctx.item.id,
				baseAmount: 0,
				discountAmount: 0,
				finalAmount: 0,
				divisionMethod: 'equal',
			}
		}

		// divide price equally
		const baseAmount = Math.round(ctx.item.price / participantsCount)

		const { discountAmount, finalAmount } = this.applyDiscounts(baseAmount, ctx)

		return {
			itemId: ctx.item.id,
			baseAmount,
			discountAmount,
			finalAmount,
			divisionMethod: 'equal',
		}
	}
}
