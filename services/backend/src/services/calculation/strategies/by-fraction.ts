import type { ItemCalculationContext, ItemCalculationResult } from '../types'
import { DivisionStrategy } from './base'

// Handles 'by_fraction' (formerly shares/equal)
// Logic: Price * (MyPortion / TotalPortions)
export class ByFractionStrategy extends DivisionStrategy {
	calculate(ctx: ItemCalculationContext): Omit<ItemCalculationResult, 'participantId'> {
		// Default to 1 portion if not specified
		const totalPortions = ctx.allParticipations.reduce((sum, p) => sum + Number(p.participationValue || 1), 0)

		if (totalPortions === 0) {
			return {
				itemId: ctx.item.id,
				baseAmount: 0,
				discountAmount: 0,
				finalAmount: 0,
				divisionMethod: 'by_fraction',
				participationValue: ctx.participation.participationValue || undefined,
			}
		}

		const myPortion = Number(ctx.participation.participationValue || 1)
		const baseAmount = Math.round(ctx.item.price * (myPortion / totalPortions))
		const { discountAmount, finalAmount } = this.applyDiscounts(baseAmount, ctx)

		return {
			itemId: ctx.item.id,
			baseAmount,
			discountAmount,
			finalAmount,
			divisionMethod: 'by_fraction',
			participationValue: ctx.participation.participationValue || undefined,
		}
	}
}
