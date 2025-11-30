import type { ItemCalculationContext, ItemCalculationResult } from '../types'
import { DivisionStrategy } from './base'

export class SharesStrategy extends DivisionStrategy {
	calculate(ctx: ItemCalculationContext): Omit<ItemCalculationResult, 'participantId'> {
		const totalShares = ctx.allParticipations.reduce((sum, p) => sum + Number(p.participationValue || 1), 0)

		if (totalShares === 0) {
			return {
				itemId: ctx.item.id,
				baseAmount: 0,
				discountAmount: 0,
				finalAmount: 0,
				divisionMethod: 'shares',
				participationValue: ctx.participation.participationValue || undefined,
			}
		}

		const myShares = Number(ctx.participation.participationValue || 1)
		const baseAmount = Math.round(ctx.item.price * (myShares / totalShares))
		const { discountAmount, finalAmount } = this.applyDiscounts(baseAmount, ctx)

		return {
			itemId: ctx.item.id,
			baseAmount,
			discountAmount,
			finalAmount,
			divisionMethod: 'shares',
			participationValue: ctx.participation.participationValue || undefined,
		}
	}
}
