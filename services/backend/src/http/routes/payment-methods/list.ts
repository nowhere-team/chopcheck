import { Hono } from 'hono'

export function createListPaymentMethodsRoute() {
	return new Hono().get('/', async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const logger = c.get('logger')

		logger.debug('listing payment methods', { userId: authContext.userId })

		const methods = await services.splits.getMyPaymentMethods(authContext.userId)

		return c.json({ success: true, data: methods })
	})
}