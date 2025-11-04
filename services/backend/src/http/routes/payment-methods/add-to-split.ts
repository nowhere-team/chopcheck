import { Hono } from 'hono'
import { z } from 'zod'

import { auth } from '@/http/middleware/auth'
import { uuidParam, validate } from '@/http/utils'

const addPaymentMethodToSplitSchema = z.object({
	paymentMethodId: z.string().uuid(),
	comment: z.string().max(2048).optional(),
	isPreferred: z.boolean().optional(),
})

export function createAddPaymentMethodToSplitRoute() {
	return new Hono().post(
		'/:id/payment-methods',
		auth(),
		uuidParam('id'),
		validate('json', addPaymentMethodToSplitSchema),
		async c => {
			const authContext = c.get('authContext')!
			const services = c.get('services')
			const logger = c.get('logger')
			const splitId = c.req.param('id')

			const dto = c.req.valid('json')

			logger.info('adding payment method to split', {
				userId: authContext.userId,
				splitId,
				paymentMethodId: dto.paymentMethodId,
			})

			await services.splits.addPaymentMethodToSplit(splitId, authContext.userId, dto)

			return c.json({ success: true, message: 'payment method added to split' }, 201)
		},
	)
}
