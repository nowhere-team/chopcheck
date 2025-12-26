// file: services/frontend/src/lib/services/api/types.ts
import type {
	// DTOs (Data)
	AddItemsDto,
	AddPaymentMethodToSplitDto,
	AuthResponseDto,
	CreateItemGroupDto,
	CreatePaymentMethodDto,
	CreateSplitDto,
	// Enums/Types
	DivisionMethod,
	ImageMetadataDto,
	ItemGroupDto,
	ItemGroupType,
	ParticipantDto,
	PaymentMethodDto,
	PaymentMethodType,
	ReceiptDto,
	ReceiptItemDto,
	ReceiptWithItemsDto,
	SavedImageInfoDto,
	ScanImageDto,
	ScanQrDto,
	SelectItemsDto,
	SplitCalculationsDto,
	SplitDto,
	SplitItemDto,
	SplitPhase,
	SplitResponseDto,
	SplitStatus,
	TelegramAuthDto,
	UpdateItemDto,
	UpdateItemGroupDto,
	UpdatePaymentMethodDto,
	UpdatePreferencesDto,
	UserDto,
	UserMeDto,
	WarningCode,
	WarningDto
} from '@chopcheck/shared'

// --- API Utils ---

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

export interface PaginatedResponse<T> {
	data?: T[]
	splits?: T[]
	pagination: {
		offset: number
		limit: number
		hasMore: boolean
	}
}

// --- Re-exports & Aliases for Frontend Convenience ---

export type User = UserDto
export type Split = SplitDto
export type SplitItem = SplitItemDto
export type ItemGroup = ItemGroupDto
export type Participant = ParticipantDto
export type PaymentMethod = PaymentMethodDto
export type Receipt = ReceiptDto
export type ReceiptItem = ReceiptItemDto
export type ReceiptWithItems = ReceiptWithItemsDto
export type Warning = WarningDto
export type ImageMetadata = ImageMetadataDto
export type SavedImageInfo = SavedImageInfoDto

export type SplitResponse = SplitResponseDto
export type SplitCalculations = SplitCalculationsDto

// --- Frontend Specific Response Types ---

export interface ReceiptImagesResponse {
	receiptId: string
	imageMetadata: ImageMetadata[]
	savedImages: SavedImageInfo[]
}

// Client-side specific types (state, UI helpers)

export interface ItemSelection {
	itemId: string
	divisionMethod: DivisionMethod
	value?: string
}

export interface DraftItem extends Omit<SplitItemDto, 'id' | 'groupId'> {
	id?: string
	groupId?: string | null
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

// Request DTO exports
export type {
	AddItemsDto,
	AddPaymentMethodToSplitDto,
	AuthResponseDto,
	CreateItemGroupDto,
	CreatePaymentMethodDto,
	CreateSplitDto,
	ReceiptWithItemsDto,
	ScanImageDto,
	ScanQrDto,
	SelectItemsDto,
	TelegramAuthDto,
	UpdateItemDto,
	UpdateItemGroupDto,
	UpdatePaymentMethodDto,
	UpdatePreferencesDto,
	UserMeDto
}

// Enums exports
export {
	DIVISION_METHODS,
	ITEM_GROUP_TYPES,
	PAYMENT_METHOD_TYPES,
	SPLIT_PHASES,
	SPLIT_STATUSES,
	WARNING_CODES
} from '@chopcheck/shared'

export type {
	DivisionMethod,
	ItemGroupType,
	PaymentMethodType,
	SplitPhase,
	SplitStatus,
	WarningCode
}
