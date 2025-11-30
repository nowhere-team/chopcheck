export type PaymentMethodType = 'sbp' | 'card' | 'phone' | 'bank_transfer' | 'cash' | 'crypto' | 'custom'

export interface PaymentMethod {
	id: string
	userId: string
	type: PaymentMethodType
	displayName: string | null
	currency: string
	paymentData: unknown
	isTemporary: boolean
	isDefault: boolean
	displayOrder: number
	isDeleted: boolean
	createdAt: Date
	updatedAt: Date
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

export interface AddPaymentMethodToSplitDto {
	paymentMethodId: string
	comment?: string
	isPreferred?: boolean
}
