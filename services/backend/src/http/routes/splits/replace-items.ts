import { Hono } from 'hono'
import { z } from 'zod'

import { requirePermission } from '@/http/middleware/auth'
import { uuidParam } from '@/http/utils'

const replaceItemsSchema = z.object({
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

export function createReplaceItemsRoute() {
	return new Hono().put('/:id/items', requirePermission('splits:write'), uuidParam('id'), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const logger = c.get('logger')
		const splitId = c.req.param('id')

		const body = await c.req.json()
		const { items } = replaceItemsSchema.parse(body)

		logger.info('replacing items in split', {
			splitId,
			userId: authContext.userId,
			itemsCount: items.length,
		})

		const split = await services.splits.replaceItems(splitId, authContext.userId, items)

		return c.json(split)
	})
}
