export interface User {
	id: string
	username?: string
	displayName: string
	avatarUrl?: string
	telegramId?: number
}

export interface UserStats {
	totalJoinedSplits: number
	monthlySpent: number
}

export interface AuthResponse {
	accessToken: string
	user: {
		id: string
		displayName: string
		username?: string
		avatarUrl?: string
	}
}

export interface Split {
	id: string
	name: string
	icon?: string
	currency: string
	status: 'draft' | 'active' | 'completed'
	phase: 'setup' | 'voting' | 'payment' | 'confirming'
	maxParticipants?: number
	expectedParticipants?: number
	scheduledAt?: string
	completedAt?: string
	createdAt: string
	updatedAt: string
	items?: SplitItem[]
	participants?: Participant[]
}

export interface SplitsByPeriod {
	thisWeek: Split[]
	thisMonth: Split[]
	earlier: Split[]
}

export interface SplitItem {
	id: string
	name: string
	price: number
	type: 'product' | 'tip' | 'delivery' | 'service_fee' | 'tax'
	quantity: string
	defaultDivisionMethod: 'custom' | 'equal' | 'shares'
}

export interface Participant {
	id: string
	userId: string | null
	displayName?: string | null
	joinedAt: string
	user: {
		id: string
		displayName: string
		username?: string
		avatarUrl?: string
	} | null
}

export interface ItemSelection {
	itemId: string
	divisionMethod: 'equal' | 'shares' | 'custom'
	value?: string
}

export interface MyParticipation {
	participant: Participant
	selections: ItemSelection[]
	totalAmount: number
}

export interface MySplitsResponse {
	splits: Split[]
}

export interface SplitResponse {
	split: Split
	items: SplitItem[]
	participants: Participant[]
}

export interface CreateSplitDto {
	name: string
	currency: string
}

export interface UpdateSplitDto {
	name?: string
	currency?: string
}

export interface AddItemDto {
	name: string
	price: number
	type?: 'product' | 'tip' | 'delivery' | 'service_fee' | 'tax'
	quantity?: string
	defaultDivisionMethod: 'custom' | 'fixed' | 'equal' | 'shares' | 'proportional'
}

export interface UpdateItemDto {
	name?: string
	price?: number
	type?: 'product' | 'tip' | 'delivery' | 'service_fee' | 'tax'
	quantity?: string
	defaultDivisionMethod?: 'equal' | 'shares' | 'fixed' | 'proportional' | 'custom'
}

export interface PaginationParams {
	offset?: number
	limit?: number
}

export interface PaginatedResponse<T> {
	data: T[]
	pagination: {
		offset: number
		limit: number
		hasMore: boolean
	}
}

export interface MySplitsResponse {
	splits: Split[]
	pagination: {
		offset: number
		limit: number
		hasMore: boolean
	}
}

export interface DraftSplitDto {
	id?: string
	name: string
	icon?: string
	currency: string
}
