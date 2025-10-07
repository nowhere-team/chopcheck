import type { ItemCalculationContext, ItemCalculationResult } from '../types'
import { DivisionStrategy } from './base'

export class SharesDivisionStrategy extends DivisionStrategy {
	calculate(ctx: ItemCalculationContext): ItemCalculationResult {
		// calculate the total number of shares
		// if Vasya took 2 shares, Petya took 1 share, Masha took 3 shares = 6 shares in total
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

		// my amount = price * (my share / total shares)
		// pizza 900₽, I took 2 out of 6 shares = 900 * (2/6) = 300₽
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
