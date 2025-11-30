import { Hono } from 'hono'
import { z } from 'zod'

import { auth } from '@/http/middleware/auth'
import { uuidParam, validate } from '@/http/utils'

const createSchema = z.object({
	type: z.enum(['sbp', 'card', 'phone', 'bank_transfer', 'cash', 'crypto', 'custom']),
	displayName: z.string().max(128).optional(),
	currency: z.string().length(3).optional(),
	paymentData: z.record(z.string(), z.unknown()),
	isTemporary: z.boolean().optional(),
	isDefault: z.boolean().optional(),
})

const updateSchema = z.object({
	displayName: z.string().max(128).optional(),
	isDefault: z.boolean().optional(),
})

export function createPaymentMethodsRoutes() {
	const app = new Hono().use('/*', auth())

	app.get('/', async c => {
		const methods = await c.get('services').paymentMethods.getMyPaymentMethods(c.get('authContext')!.userId)
		return c.json({ success: true, data: methods })
	})

	app.post('/', validate('json', createSchema), async c => {
		const pm = await c.get('services').paymentMethods.create(c.get('authContext')!.userId, c.req.valid('json'))
		return c.json({ success: true, data: pm }, 201)
	})

	app.patch('/:id', uuidParam('id'), validate('json', updateSchema), async c => {
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
