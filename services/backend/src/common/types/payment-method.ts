// types для payment methods

export type PaymentMethodType = 'sbp' | 'card' | 'phone' | 'bank_transfer' | 'cash' | 'crypto' | 'custom'

export interface PaymentMethod {
	id: string
	userId: string
	type: PaymentMethodType
	displayName: string | null
	currency: string
	paymentData: unknown // json с реквизитами (drizzle jsonb возвращает unknown)
	isTemporary: boolean // временный метод созданный при создании сплита
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
	isPreferred: boolean // предпочтительный метод для этого сплита
	displayOrder: number
	createdAt: Date
	updatedAt: Date
}

// dto для создания метода оплаты
export interface CreatePaymentMethodDto {
	type: PaymentMethodType
	displayName?: string
	currency?: string
	paymentData: {
		// для sbp
		phone?: string
		// для card
		cardNumber?: string
		cardHolder?: string
		// для bank_transfer
		accountNumber?: string
		bankName?: string
		bik?: string
		// для phone
		phoneNumber?: string
		// для cash/crypto/custom
		description?: string
	}
	isTemporary?: boolean
	isDefault?: boolean
}

// dto для обновления метода оплаты
export interface UpdatePaymentMethodDto {
	displayName?: string
	isDefault?: boolean
}

// dto для привязки метода к сплиту
export interface AddPaymentMethodToSplitDto {
	paymentMethodId: string
	comment?: string
	isPreferred?: boolean
}