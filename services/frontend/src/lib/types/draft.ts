export interface DraftItem {
	id?: string
	name: string
	price: number
	quantity: string
	type: 'product' | 'tip' | 'delivery' | 'service_fee' | 'tax'
	defaultDivisionMethod: 'equal' | 'shares' | 'custom'
	icon?: string
}

export interface DraftSplit {
	id?: string
	name: string
	icon: string
	currency: string
	items: DraftItem[]
	expectedParticipants?: number
	maxParticipants?: number
	lastSyncedAt?: string
}
