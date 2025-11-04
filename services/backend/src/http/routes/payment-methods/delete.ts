import { Hono } from 'hono'

import { uuidParam } from '@/http/utils'

export function createDeletePaymentMethodRoute() {
	return new Hono().delete('/:id', uuidParam('id'), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const logger = c.get('logger')
		const paymentMethodId = c.req.param('id')

		logger.info('deleting payment method', {
			userId: authContext.userId,
			paymentMethodId,
		})

		await services.splits.deletePaymentMethod(paymentMethodId, authContext.userId)

		return c.json({ success: true, message: 'payment method deleted' })
	})
}
