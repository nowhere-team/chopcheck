import { Hono } from 'hono'
import { z } from 'zod'

import { validate } from '@/http/utils'

const paymentMethodTypeSchema = z.enum(['sbp', 'card', 'phone', 'bank_transfer', 'cash', 'crypto', 'custom'])

const createPaymentMethodSchema = z.object({
	type: paymentMethodTypeSchema,
	displayName: z.string().max(128).optional(),
	currency: z.string().length(3).optional(),
	paymentData: z.object({
		phone: z.string().optional(),
		cardNumber: z.string().optional(),
		cardHolder: z.string().optional(),
		accountNumber: z.string().optional(),
		bankName: z.string().optional(),
		bik: z.string().optional(),
		phoneNumber: z.string().optional(),
		description: z.string().optional(),
	}),
	isTemporary: z.boolean().optional(),
	isDefault: z.boolean().optional(),
})

export function createCreatePaymentMethodRoute() {
	return new Hono().post('/', validate('json', createPaymentMethodSchema), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const logger = c.get('logger')

		const dto = c.req.valid('json')

		logger.info('creating payment method via api', {
			userId: authContext.userId,
			type: dto.type,
		})

		const paymentMethod = await services.splits.createPaymentMethod(authContext.userId, dto)

		return c.json({ success: true, data: paymentMethod }, 201)
	})
}
