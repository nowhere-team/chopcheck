import type { ItemCalculationContext, ItemCalculationResult } from '../types'

export abstract class DivisionStrategy {
	abstract calculate(ctx: ItemCalculationContext): ItemCalculationResult

	protected applyDiscounts(
		baseAmount: number,
		ctx: ItemCalculationContext,
	): { discountAmount: number; finalAmount: number } {
		let discountAmount = 0

		// 1. item discount
		if (ctx.item.itemDiscount) {
			const itemDiscountPerPerson = Math.round(Number(ctx.item.itemDiscount) / ctx.allParticipations.length)
			discountAmount += itemDiscountPerPerson
		}

		// 2. receipt discount (if participant agreed)
		if (ctx.participation.applyTotalDiscount) {
			// proportional
			if (ctx.totalDiscountPercent && Number(ctx.totalDiscountPercent) > 0) {
				const percentDiscount = Math.round((baseAmount * Number(ctx.totalDiscountPercent)) / 100)
				discountAmount += percentDiscount
			} else if (ctx.totalDiscount > 0) {
				// fix sum shared proportionally
				// todo: need to do on receipt level (now is item level)
				// now let's do it as-is
				discountAmount += Math.round(ctx.totalDiscount / ctx.allParticipations.length)
			}
		}

		const finalAmount = Math.max(0, baseAmount - discountAmount)

		return { discountAmount, finalAmount }
	}
}
