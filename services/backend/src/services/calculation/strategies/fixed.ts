import type { ItemCalculationContext, ItemCalculationResult } from '../types'
import { DivisionStrategy } from './base'

export class FixedDivisionStrategy extends DivisionStrategy {
	calculate(ctx: ItemCalculationContext): ItemCalculationResult {
		const baseAmount = Number(ctx.participation.participationValue || 0)

		const { discountAmount, finalAmount } = this.applyDiscounts(baseAmount, ctx)

		return {
			itemId: ctx.item.id,
			baseAmount,
			discountAmount,
			finalAmount,
			divisionMethod: 'fixed',
			participationValue: ctx.participation.participationValue || undefined,
		}
	}
}
