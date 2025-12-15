import type { ItemCalculationContext, ItemCalculationResult } from '../types'
import { DivisionStrategy } from './base'

// Handles 'by_amount' (usually service fees, tips, delivery)
// Maps to proportional calculation (percentage) or fixed contribution if value is large?
// Catalog "by_amount" usually implies a fee derived from subtotal.
// If users select this item, they usually pay a percentage of it relative to their order?
// OR: Users pay a specific manually entered amount.
// Implementation: Treat participationValue as Percentage (0-100) of the item cost.
export class ByAmountStrategy extends DivisionStrategy {
	calculate(ctx: ItemCalculationContext): Omit<ItemCalculationResult, 'participantId'> {
		// Interpreting participationValue as Percentage (e.g. "10" = 10%)
		// This fits "service_fee" logic where we distribute responsibility
		const percentage = Number(ctx.participation.participationValue || 0)
		const baseAmount = Math.round(ctx.item.price * (percentage / 100))

		const { discountAmount, finalAmount } = this.applyDiscounts(baseAmount, ctx)

		return {
			itemId: ctx.item.id,
			baseAmount,
			discountAmount,
			finalAmount,
			divisionMethod: 'by_amount',
			participationValue: ctx.participation.participationValue || undefined,
		}
	}
}
