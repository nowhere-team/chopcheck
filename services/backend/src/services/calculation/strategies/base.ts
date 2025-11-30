import type { ItemCalculationContext, ItemCalculationResult } from '../types'

export abstract class DivisionStrategy {
	abstract calculate(ctx: ItemCalculationContext): Omit<ItemCalculationResult, 'participantId'>

	protected applyDiscounts(
		baseAmount: number,
		ctx: ItemCalculationContext,
	): { discountAmount: number; finalAmount: number } {
		let discountAmount = 0

		if (ctx.item.itemDiscount) {
			discountAmount += Math.round(Number(ctx.item.itemDiscount) / ctx.allParticipations.length)
		}

		if (ctx.participation.applyTotalDiscount) {
			if (ctx.totalDiscountPercent && Number(ctx.totalDiscountPercent) > 0) {
				discountAmount += Math.round((baseAmount * Number(ctx.totalDiscountPercent)) / 100)
			} else if (ctx.totalDiscount > 0) {
				discountAmount += Math.round(ctx.totalDiscount / ctx.allParticipations.length)
			}
		}

		return { discountAmount, finalAmount: Math.max(0, baseAmount - discountAmount) }
	}
}
