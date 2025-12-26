import { z } from 'zod'
import { PAYMENT_METHOD_TYPES } from './enums'

export const createPaymentMethodSchema = z.object({
	type: z.enum(PAYMENT_METHOD_TYPES),
	displayName: z.string().max(128).optional(),
	currency: z.string().length(3).optional(),
	paymentData: z.record(z.string(), z.unknown()),
	isTemporary: z.boolean().optional(),
	isDefault: z.boolean().optional(),
})

export const updatePaymentMethodSchema = z.object({
	displayName: z.string().max(128).optional(),
	isDefault: z.boolean().optional(),
})

export const addPaymentMethodToSplitSchema = z.object({
	paymentMethodId: z.uuid(),
	comment: z.string().max(2048).optional(),
	isPreferred: z.boolean().optional(),
})

export type CreatePaymentMethodDto = z.infer<typeof createPaymentMethodSchema>
export type UpdatePaymentMethodDto = z.infer<typeof updatePaymentMethodSchema>
export type AddPaymentMethodToSplitDto = z.infer<typeof addPaymentMethodToSplitSchema>
