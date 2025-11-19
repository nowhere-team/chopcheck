import { Hono } from 'hono'
import { z } from 'zod'

import { validate } from '@/http/utils'
import { anonymizeSplitResponse } from '@/http/utils'
import { validate } from '@/http/utils'
import { anonymizeSplitResponse } from '@/http/utils'

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
	return new Hono().post('/:id/items', validate('json', addItemsSchema), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const splitId = c.req.param('id')
		const { items } = c.req.valid('json')

		const split = await services.splits.addItems(splitId, authContext.userId, items)

		return c.json(anonymizeSplitResponse(split))
	})
}
