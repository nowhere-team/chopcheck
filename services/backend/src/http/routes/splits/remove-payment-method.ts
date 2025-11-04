import { Hono } from 'hono'

import { auth } from '@/http/middleware/auth'
import { uuidParam } from '@/http/utils'

export function createRemovePaymentMethodFromSplitRoute() {
	return new Hono().delete(
		'/:id/payment-methods/:paymentMethodId',
		auth(),
		uuidParam('id'),
		uuidParam('paymentMethodId'),
		async c => {
			const authContext = c.get('authContext')!
			const services = c.get('services')
			const logger = c.get('logger')
			const splitId = c.req.param('id')
			const paymentMethodId = c.req.param('paymentMethodId')

			logger.info('removing payment method from split', {
				userId: authContext.userId,
				splitId,
				paymentMethodId,
			})

			await services.splits.removePaymentMethodFromSplit(splitId, paymentMethodId, authContext.userId)

			return c.json({ success: true, message: 'payment method removed from split' })
		},
	)
}
