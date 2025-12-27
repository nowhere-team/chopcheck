import { z } from 'zod'
import { dateSchema, uuidSchema } from '../common'
import { PAYMENT_METHOD_TYPES } from '../enums'

// --- Schemas ---

export const paymentMethodSchema = z.object({
	id: uuidSchema,
	userId: uuidSchema,
	type: z.enum(PAYMENT_METHOD_TYPES),
	displayName: z.string().nullable(),
	currency: z.string(),
	paymentData: z.record(z.string(), z.unknown()), // JSON
	isTemporary: z.boolean(),
	isDefault: z.boolean(),
	displayOrder: z.number(),
	createdAt: dateSchema,
	updatedAt: dateSchema,
})

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
	paymentMethodId: uuidSchema,
	comment: z.string().max(2048).optional(),
	isPreferred: z.boolean().optional(),
})

// --- Types ---

export type PaymentMethodDto = z.infer<typeof paymentMethodSchema>
export type CreatePaymentMethodDto = z.infer<typeof createPaymentMethodSchema>
export type UpdatePaymentMethodDto = z.infer<typeof updatePaymentMethodSchema>
export type AddPaymentMethodToSplitDto = z.infer<typeof addPaymentMethodToSplitSchema>
