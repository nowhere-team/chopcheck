import { Hono } from 'hono'
import { z } from 'zod'

import { NotFoundError } from '@/common/errors'
import { uuidParam, validate } from '@/http/utils'

const updateItemSchema = z.object({
	name: z.string().min(1).max(128).optional(),
	price: z.number().int().positive().optional(),
	type: z.enum(['product', 'tip', 'delivery', 'service_fee', 'tax']).optional(),
	quantity: z.string().optional(),
	defaultDivisionMethod: z.enum(['equal', 'shares', 'fixed', 'proportional', 'custom']).optional(),
})

export function createUpdateItemRoute() {
	return new Hono().patch(
		'/:id/items/:itemId',
		uuidParam('id'),
		uuidParam('itemId'),
		validate('json', updateItemSchema),
		async c => {
			const authContext = c.get('authContext')!
			const services = c.get('services')
			const logger = c.get('logger')
			const splitId = c.req.param('id')
			const itemId = c.req.param('itemId')

			const data = c.req.valid('json')

			logger.info('updating item', { splitId, itemId, userId: authContext.userId })

			const split = await services.splits.updateItem(splitId, itemId, authContext.userId, data)

			if (!split) {
				throw new NotFoundError('split or item not found')
			}

			return c.json(split)
		},
	)
}
