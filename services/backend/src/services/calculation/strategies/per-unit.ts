import type { ItemCalculationContext, ItemCalculationResult } from '../types'
import { DivisionStrategy } from './base'

// Handles 'per_unit' (unit based items)
// Logic: Price is Total Price. We need Unit Price.
// If item.quantity is 5, and Price is 500. Unit Price is 100.
// If I take 2 units -> 200.
export class PerUnitStrategy extends DivisionStrategy {
	calculate(ctx: ItemCalculationContext): Omit<ItemCalculationResult, 'participantId'> {
		// Calculate unit price from total price and quantity
		const totalQuantity = Number(ctx.item.quantity || 1)
		const unitPrice = totalQuantity > 0 ? ctx.item.price / totalQuantity : ctx.item.price

		// My claimed units
		const myUnits = Number(ctx.participation.participationValue || 1)

		const baseAmount = Math.round(unitPrice * myUnits)
		const { discountAmount, finalAmount } = this.applyDiscounts(baseAmount, ctx)

		return {
			itemId: ctx.item.id,
			baseAmount,
			discountAmount,
			finalAmount,
			divisionMethod: 'per_unit',
			participationValue: ctx.participation.participationValue || undefined,
		}
	}
}
