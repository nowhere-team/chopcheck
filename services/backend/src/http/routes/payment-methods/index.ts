import { createPaymentMethodSchema, updatePaymentMethodSchema } from '@chopcheck/shared'
import { Hono } from 'hono'

import { auth } from '@/http/middleware/auth'
import { uuidParam, validate } from '@/http/utils'

export function createPaymentMethodsRoutes() {
	const app = new Hono().use('/*', auth())

	app.get('/', async c => {
		const methods = await c.get('services').paymentMethods.getMyPaymentMethods(c.get('authContext')!.userId)
		return c.json({ success: true, data: methods })
	})

	app.post('/', validate('json', createPaymentMethodSchema), async c => {
		const pm = await c.get('services').paymentMethods.create(c.get('authContext')!.userId, c.req.valid('json'))
		return c.json({ success: true, data: pm }, 201)
	})

	app.patch('/:id', uuidParam('id'), validate('json', updatePaymentMethodSchema), async c => {
		const pm = await c
			.get('services')
			.paymentMethods.update(c.req.param('id'), c.get('authContext')!.userId, c.req.valid('json'))
		return c.json({ success: true, data: pm })
	})

	app.delete('/:id', uuidParam('id'), async c => {
		await c.get('services').paymentMethods.delete(c.req.param('id'), c.get('authContext')!.userId)
		return c.json({ success: true })
	})

	return app
}
