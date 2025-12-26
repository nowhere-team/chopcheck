import type { SplitCalculationsDto, SplitResponseDto } from '@chopcheck/shared'

export type SplitResponse = SplitResponseDto
export type SplitCalculations = SplitCalculationsDto

// Dto re-exports for service layers
export type { CreateItemGroupDto, CreateSplitDto, SplitItemDto, UpdateItemGroupDto } from '@chopcheck/shared'
export {
	createItemGroupDtoSchema,
	createSplitSchema,
	splitItemSchema,
	updateItemGroupDtoSchema,
} from '@chopcheck/shared'
