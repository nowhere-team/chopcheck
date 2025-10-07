import type { Item, ParticipantItem } from '@/common/types'

export interface ItemCalculationContext {
	item: Item
	participation: ParticipantItem
	allParticipations: ParticipantItem[]
	totalDiscount: number
	totalDiscountPercent: string
}

export interface ItemCalculationResult {
	itemId: string
	baseAmount: number
	discountAmount: number
	finalAmount: number
	divisionMethod: string
	participationValue?: string
}
