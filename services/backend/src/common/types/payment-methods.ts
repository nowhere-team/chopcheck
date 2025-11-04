export type PaymentMethodType = 'sbp' | 'card' | 'phone' | 'bank_transfer' | 'cash' | 'crypto' | 'custom'

export interface PaymentMethods {
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
	deletedAt: Date | null
	createdAt: Date
	updatedAt: Date
}

export interface SplitPaymentMethod {
	id: string
	splitId: string
	paymentMethodId: string
	comment: string | null
	isPreferred: boolean
	displayOrder: number
	createdAt: Date
	updatedAt: Date
}

export interface CreatePaymentMethodDto {
	type: PaymentMethodType
	displayName?: string
	currency?: string
	paymentData: {
		phone?: string
		cardNumber?: string
		cardHolder?: string
		accountNumber?: string
		bankName?: string
		bik?: string
		phoneNumber?: string
		description?: string
	}
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
