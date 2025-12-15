export interface ApiRequestOptions extends RequestInit {
	timeout?: number
	skipAuth?: boolean
}

export interface ApiErrorData {
	message: string
	code?: string
	details?: Record<string, unknown>
}

export class ApiError extends Error {
	constructor(
		message: string,
		public status: number,
		public code?: string,
		public details?: Record<string, unknown>
	) {
		super(message)
		this.name = 'ApiError'
	}

	get isUnauthorized(): boolean {
		return this.status === 401
	}

	get isNotFound(): boolean {
		return this.status === 404
	}

	get isNetworkError(): boolean {
		return this.status === 0
	}
}

// backend entity types
export interface User {
	id: string
	displayName: string
	username?: string
	avatarUrl?: string
	telegramId?: number
}

export interface UserStats {
	totalJoinedSplits: number
	monthlySpent: number
}

export interface Split {
	id: string
	shortId: string
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

export interface SplitItem {
	id: string
	name: string
	price: number
	type: 'product' | 'tip' | 'delivery' | 'service_fee' | 'tax'
	quantity: string
	icon?: string
	groupId?: string | null
	defaultDivisionMethod: 'by_fraction' | 'by_amount' | 'per_unit' | 'custom'
}

export interface ItemGroup {
	id: string
	splitId: string
	receiptId?: string | null
	type: 'receipt' | 'manual' | 'custom'
	name: string
	icon?: string | null
	displayOrder: number
	isCollapsed: boolean
	createdAt: string
	updatedAt: string
}

export interface Participant {
	id: string
	userId: string | null
	displayName?: string | null
	isAnonymous: boolean
	joinedAt: string
	user: {
		id: string
		displayName: string
		username?: string
		avatarUrl?: string
	} | null
}

export interface SplitsByPeriod {
	thisWeek: Split[]
	thisMonth: Split[]
	earlier: Split[]
}

export interface Contact {
	userId: string
	displayName: string
	username?: string
	avatarUrl?: string
	isDeleted: boolean
	totalSplits: number
	lastInteraction: string
	firstInteraction: string
	metadata?: {
		totalOwed?: number
		totalOwing?: number
	}
}

export interface PaginatedResponse<T> {
	data?: T[]
	splits?: T[]
	pagination: {
		offset: number
		limit: number
		hasMore: boolean
	}
}

// request/response types
export interface CreateSplitDto {
	name: string
	currency?: string
	icon?: string
	items?: Array<{
		id?: string
		name: string
		price: number
		quantity: string
		type?: SplitItem['type']
		defaultDivisionMethod?: SplitItem['defaultDivisionMethod']
	}>
}

export interface SplitResponse {
	split: Split
	items: SplitItem[]
	itemGroups: ItemGroup[]
	participants: Participant[]
	calculations?: SplitCalculations
}

export interface SplitCalculations {
	participants: ParticipantCalculation[]
	totals: {
		splitAmount: number
		collected: number
		difference: number
	}
}

export interface ParticipantCalculation {
	participantId: string
	displayName: string
	totalBase: number
	totalDiscount: number
	totalFinal: number
	items: Record<string, ItemCalculation>
}

export interface ItemCalculation {
	baseAmount: number
	discountAmount: number
	finalAmount: number
	divisionMethod: string
	participationValue?: string
}

export interface ItemSelection {
	itemId: string
	divisionMethod: 'by_fraction' | 'by_amount' | 'per_unit' | 'custom'
	value?: string
}

export interface DraftItem {
	id?: string
	name: string
	price: number
	quantity: string
	type: 'product' | 'tip' | 'delivery' | 'service_fee' | 'tax'
	defaultDivisionMethod: 'by_fraction' | 'by_amount' | 'per_unit' | 'custom'
	icon?: string
	groupId?: string | null
}
