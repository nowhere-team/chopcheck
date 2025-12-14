import { z } from 'zod'

import type { Item, ParticipantWithSelections, Split } from './entities'

export const createSplitSchema = z.object({
	id: z.uuid().optional(),
	icon: z.string().optional(),
	name: z.string().min(1).max(255),
	currency: z.string().length(3).default('RUB'),
	items: z
		.array(
			z.object({
				id: z.uuid().optional(),
				name: z.string().min(1).max(128),
				price: z.number().int().positive(),
				type: z.enum(['product', 'tip', 'delivery', 'service_fee', 'tax']).default('product'),
				quantity: z.string().default('1'),
				defaultDivisionMethod: z.enum(['equal', 'shares', 'fixed', 'proportional', 'custom']).default('equal'),
				icon: z.string().optional(),
			}),
		)
		.optional(),
	receiptIds: z.array(z.uuid()).optional(),
})

export type CreateSplitDto = z.infer<typeof createSplitSchema>

export interface SplitData {
	split: Split
	items: Item[]
	participants: ParticipantWithSelections[]
}

export interface ParticipantCalculation {
	participantId: string
	displayName: string
	totalBase: number
	totalDiscount: number
	totalFinal: number
	items: Record<
		string,
		{
			baseAmount: number
			discountAmount: number
			finalAmount: number
			divisionMethod: string
			participationValue?: string
		}
	>
}

export interface SplitCalculations {
	participants: ParticipantCalculation[]
	totals: {
		splitAmount: number
		collected: number
		difference: number
	}
}

export interface SplitResponse extends SplitData {
	calculations?: SplitCalculations
	receipts?: Array<{ id: string; placeName?: string | null; total: number; createdAt: Date }>
}

export interface SplitsByPeriod {
	thisWeek: Split[]
	thisMonth: Split[]
	earlier: Split[]
}
