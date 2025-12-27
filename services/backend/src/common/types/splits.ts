import type { SplitCalculationsDto, SplitResponseDto } from '@chopcheck/shared'

import type { Item, ItemGroup, ParticipantWithSelections, Split } from './entities'

export type SplitResponse = SplitResponseDto
export type SplitCalculations = SplitCalculationsDto

// Dto re-exports for service layers
export type {
	AddItemsDto,
	AddPaymentMethodToSplitDto,
	CreateItemGroupDto,
	CreateSplitDto,
	SelectItemsDto,
	SplitItemDto,
	UpdateItemDto,
	UpdateItemGroupDto,
} from '@chopcheck/shared'
export {
	addItemsDtoSchema,
	addPaymentMethodToSplitSchema,
	createItemGroupDtoSchema,
	createSplitSchema,
	selectItemsDtoSchema,
	splitItemSchema,
	updateItemDtoSchema,
	updateItemGroupDtoSchema,
} from '@chopcheck/shared'

// Backend-specific types (not DTOs)
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

export interface SplitsByPeriod {
	thisWeek: Split[]
	thisMonth: Split[]
	earlier: Split[]
}
