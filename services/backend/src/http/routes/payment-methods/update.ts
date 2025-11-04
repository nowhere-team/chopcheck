import { Hono } from 'hono'
import { z } from 'zod'

import { uuidParam, validate } from '@/http/utils'

const updatePaymentMethodSchema = z.object({
	displayName: z.string().max(128).optional(),
	isDefault: z.boolean().optional(),
})

export function createUpdatePaymentMethodRoute() {
	return new Hono().patch('/:id', uuidParam('id'), validate('json', updatePaymentMethodSchema), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const logger = c.get('logger')
		const paymentMethodId = c.req.param('id')

		const dto = c.req.valid('json')

		logger.info('updating payment method', {
			userId: authContext.userId,
			paymentMethodId,
		})

		const updated = await services.splits.updatePaymentMethod(paymentMethodId, authContext.userId, dto)

		return c.json({ success: true, data: updated })
	})
}
