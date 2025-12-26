import type { PaymentMethodType } from '@chopcheck/shared'

export type {
	AddPaymentMethodToSplitDto,
	CreatePaymentMethodDto,
	PaymentMethodType,
	UpdatePaymentMethodDto,
} from '@chopcheck/shared'
export { addPaymentMethodToSplitSchema, createPaymentMethodSchema, updatePaymentMethodSchema } from '@chopcheck/shared'

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
