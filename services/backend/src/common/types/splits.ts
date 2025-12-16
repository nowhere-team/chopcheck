import { z } from 'zod'

import { DIVISION_METHODS, ITEM_GROUP_TYPES } from '@/platform/database/schema/enums'

import type { Item, ItemGroup, ParticipantWithSelections, Split } from './entities'

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
				defaultDivisionMethod: z.enum(DIVISION_METHODS).default('per_unit'),
				icon: z.string().optional(),
			}),
		)
		.optional(),
	receiptIds: z.array(z.uuid()).optional(),
})

export const createItemGroupSchema = z.object({
	name: z.string().min(1).max(255),
	icon: z.string().optional(),
	type: z.enum(ITEM_GROUP_TYPES).default('custom'),
})

export const updateItemGroupSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	icon: z.string().optional(),
	isCollapsed: z.boolean().optional(),
})

export type CreateSplitDto = z.infer<typeof createSplitSchema>
export type CreateItemGroupDto = z.infer<typeof createItemGroupSchema>
export type UpdateItemGroupDto = z.infer<typeof updateItemGroupSchema>

export interface SplitData {
	split: Split
	items: Item[]
	itemGroups: ItemGroup[]
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
