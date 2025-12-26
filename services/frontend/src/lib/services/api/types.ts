import type {
	// DTOs (Data)
	AddPaymentMethodToSplitDto,
	AuthResponseDto,
	CreateItemGroupDto,
	CreatePaymentMethodDto,
	CreateSplitDto,
	// Enums/Types
	DivisionMethod,
	ItemGroupDto,
	ParticipantDto,
	PaymentMethodDto,
	PaymentMethodType,
	ReceiptDto,
	ReceiptItemDto,
	ScanImageDto,
	ScanQrDto,
	SelectItemsDto,
	SplitCalculationsDto,
	SplitDto,
	SplitItemDto,
	SplitResponseDto,
	SplitStatus,
	TelegramAuthDto,
	UpdateItemGroupDto,
	UpdatePaymentMethodDto,
	UserDto,
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
	splits?: T[] // legacy field support if needed, or unify
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
export type Warning = WarningDto

export type SplitResponse = SplitResponseDto
export type SplitCalculations = SplitCalculationsDto

// Client-side specific types (state, UI helpers)

export interface ItemSelection {
	itemId: string
	divisionMethod: DivisionMethod
	value?: string
}

export interface DraftItem extends Omit<SplitItemDto, 'id' | 'groupId'> {
	id?: string // Optional for new items
	groupId?: string | null
}

export interface SplitsByPeriod {
	thisWeek: Split[]
	thisMonth: Split[]
	earlier: Split[]
}

// Contact specific interface (aggregates user info)
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
	AddPaymentMethodToSplitDto,
	AuthResponseDto,
	CreateItemGroupDto,
	CreatePaymentMethodDto,
	CreateSplitDto,
	ScanImageDto,
	ScanQrDto,
	SelectItemsDto,
	TelegramAuthDto,
	UpdateItemGroupDto,
	UpdatePaymentMethodDto
}

// Enums exports
export { DIVISION_METHODS, PAYMENT_METHOD_TYPES, WARNING_CODES } from '@chopcheck/shared'

export type { DivisionMethod, PaymentMethodType, SplitStatus, WarningCode }
