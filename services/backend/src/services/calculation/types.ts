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
	participantId: string
	baseAmount: number
	discountAmount: number
	finalAmount: number
	divisionMethod: string
	participationValue?: string
}

export interface ParticipantTotal {
	participantId: string
	totalBase: number
	totalDiscount: number
	totalFinal: number
}

export interface SplitCalculationResult {
	itemResults: ItemCalculationResult[]
	participantTotals: ParticipantTotal[]
	splitTotal: number
	collected: number
	difference: number
}
