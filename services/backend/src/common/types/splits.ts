import { z } from 'zod'

import type { Item, Split } from '@/common/types'
import type { ParticipantWithSelections } from '@/common/types/entities'
import type { ItemCalculationResult } from '@/services/calculation/types'

// DTO for incoming requests

export const createSplitSchema = z.object({
	name: z.string().min(1).max(255),
	currency: z.string().length(3).default('RUB'),
	items: z
		.array(
			z.object({
				name: z.string().min(1).max(128),
				price: z.number().int().positive(),
				type: z.enum(['product', 'tip', 'delivery', 'service_fee', 'tax']).default('product'),
				quantity: z.string().default('1'),
				defaultDivisionMethod: z.enum(['equal', 'shares', 'fixed', 'proportional', 'custom']).default('equal'),
			}),
		)
		.optional(),
})

export type CreateSplitDto = z.infer<typeof createSplitSchema>

// basic types

export interface SplitData {
	split: Split
	items: Item[]
	participants: ParticipantWithSelections[]
}

// for api answers

export interface ParticipantCalculationData {
	participantId: string
	totalBaseAmount: number
	totalDiscountAmount: number
	totalAmount: number
	items: Record<string, Omit<ItemCalculationResult, 'itemId'>> // itemId is key already
}

export interface CalculationTotals {
	splitAmount: number
	collected: number
	difference: number
}

export interface Calculations {
	participants: ParticipantCalculationData[]
	totals: CalculationTotals
}

export interface SplitResponse extends SplitData {
	calculations?: Calculations
}

export interface SplitsByPeriod {
	thisWeek: Split[]
	thisMonth: Split[]
	earlier: Split[]
}
