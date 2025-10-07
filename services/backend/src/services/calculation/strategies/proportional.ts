import type { ItemCalculationContext, ItemCalculationResult } from '../types'
import { DivisionStrategy } from './base'

export class ProportionalDivisionStrategy extends DivisionStrategy {
	calculate(ctx: ItemCalculationContext): ItemCalculationResult {
		const percent = Number(ctx.participation.participationValue || 0)
		const baseAmount = Math.round(ctx.item.price * (percent / 100))

		const { discountAmount, finalAmount } = this.applyDiscounts(baseAmount, ctx)

		return {
			itemId: ctx.item.id,
			baseAmount,
			discountAmount,
			finalAmount,
			divisionMethod: 'proportional',
			participationValue: ctx.participation.participationValue || undefined,
		}
	}
}
