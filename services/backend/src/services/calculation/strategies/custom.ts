import type { ItemCalculationContext, ItemCalculationResult } from '../types'
import { DivisionStrategy } from './base'

export class CustomDivisionStrategy extends DivisionStrategy {
	calculate(ctx: ItemCalculationContext): ItemCalculationResult {
		// just get calculated_sum from db
		const finalAmount = ctx.participation.calculatedSum || 0

		return {
			itemId: ctx.item.id,
			baseAmount: finalAmount, // base = final
			discountAmount: 0,
			finalAmount,
			divisionMethod: 'custom',
		}
	}
}
