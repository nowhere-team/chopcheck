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

export const WARNING_CODES = [
	'low_confidence_item',
	'possible_ocr_error',
	'price_anomaly',
	'missing_price',
	'missing_quantity',
	'multiple_alcohol_items',
	'total_mismatch',
	'unknown_category',
	'duplicate_item',
	'incomplete_place_data',
	'unreadable_receipt',
	'partial_extraction'
] as const

export type WarningCode = (typeof WARNING_CODES)[number]

export interface Warning {
	code: WarningCode
	itemIndex?: number
	details?: string
}

export type Unit = 'piece' | 'g' | 'kg' | 'ml' | 'l' | 'pack' | 'portion' | 'set' | 'other'

export interface SplitItem {
	id: string
	name: string
	price: number
	type: 'product' | 'tip' | 'delivery' | 'service_fee' | 'tax'
	quantity: string
	unit?: Unit | string
	icon?: string
	groupId?: string | null
	defaultDivisionMethod: 'by_fraction' | 'by_amount' | 'per_unit' | 'custom'
	warnings?: Warning[]
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
	warnings?: Warning[]
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
}

// payment methods
export type PaymentMethodType =
	| 'sbp'
	| 'card'
	| 'phone'
	| 'bank_transfer'
	| 'cash'
	| 'crypto'
	| 'custom'

export interface PaymentMethod {
	id: string
	userId: string
	type: PaymentMethodType
	displayName: string | null
	currency: string
	paymentData: Record<string, unknown>
	isTemporary: boolean
	isDefault: boolean
	displayOrder: number
	isDeleted: boolean
	createdAt: string
	updatedAt: string
}

export interface CreatePaymentMethodDto {
	type: PaymentMethodType
	displayName?: string
	currency?: string
	paymentData: Record<string, unknown>
	isTemporary?: boolean
	isDefault?: boolean
}

export interface UpdatePaymentMethodDto {
	displayName?: string
	isDefault?: boolean
}

export interface SplitPaymentMethod {
	id: string
	splitId: string
	paymentMethodId: string
	comment: string | null
	isPreferred: boolean
	paymentMethod: PaymentMethod
}

export interface AddPaymentMethodToSplitDto {
	paymentMethodId: string
	comment?: string
	isPreferred?: boolean
}

// catalog image types
export interface BboxCoords {
	index: number
	coords: [number, number, number, number] // [y_min, x_min, y_max, x_max]
}

export interface ImageMetadata {
	index: number
	bbox: [number, number, number, number] | null
	rotation: 0 | 90 | 180 | 270
}

export interface SavedImageInfo {
	id: string
	index: number
	isDuplicate?: boolean
	originalUrl: string
	url?: string // signed url, expires in ~1 hour
}

export interface ReceiptImagesResponse {
	receiptId: string
	imageMetadata: ImageMetadata[]
	savedImages: SavedImageInfo[]
}

export interface ReceiptItem {
	id: string
	rawName: string
	name?: string
	category?: string
	subcategory?: string
	emoji?: string
	tags?: string[]
	price: number
	quantity: string
	unit?: string
	sum: number
	discount?: number
	bbox?: BboxCoords | null
	suggestedSplitMethod?: 'by_fraction' | 'by_amount' | 'per_unit' | 'custom'
	displayOrder: number
	warnings?: Warning[]
}

export interface Receipt {
	id: string
	userId: string
	source: 'qr' | 'image' | 'manual'
	status: 'pending' | 'processing' | 'enriched' | 'failed'
	placeName?: string
	placeAddress?: string
	currency: string
	total: number
	receiptDate?: string
	imageMetadata?: ImageMetadata[]
	savedImages?: SavedImageInfo[]
	detectedLanguage?: string
	createdAt: string
	updatedAt: string
}

export interface ReceiptWithItems {
	receipt: Receipt
	items: ReceiptItem[]
}
