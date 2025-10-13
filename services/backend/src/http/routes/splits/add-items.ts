import { Hono } from 'hono'
import { z } from 'zod'

const addItemsSchema = z.object({
	items: z.array(
		z.object({
			name: z.string().min(1).max(128),
			price: z.number().int().positive(),
			type: z.enum(['product', 'tip', 'delivery', 'service_fee', 'tax']).default('product'),
			quantity: z.string().default('1'),
			defaultDivisionMethod: z.enum(['custom', 'fixed', 'equal', 'shares', 'proportional']),
		}),
	),
})

export function createAddItemsRoute() {
	return new Hono().post('/:id/items', async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const splitId = c.req.param('id')

		const body = await c.req.json()
		const { items } = addItemsSchema.parse(body)

		const split = await services.splits.addItems(splitId, authContext.userId, items)

		return c.json(split)
	})
}
