import { Hono } from 'hono'

import { auth } from '@/http/middleware/auth'
import { uuidParam } from '@/http/utils'

export function createListSplitPaymentMethodsRoute() {
	return new Hono().get('/:id/payment-methods', auth(), uuidParam('id'), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const logger = c.get('logger')
		const splitId = c.req.param('id')

		logger.debug('listing split payment methods', {
			userId: authContext.userId,
			splitId,
		})

		const methods = await services.splits.getSplitPaymentMethods(splitId, authContext.userId)

		return c.json({ success: true, data: methods })
	})
}
