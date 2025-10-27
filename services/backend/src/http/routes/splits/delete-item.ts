import { Hono } from 'hono'

import { NotFoundError } from '@/common/errors'
import { uuidParam } from '@/http/utils'

export function createDeleteItemRoute() {
	return new Hono().delete('/:id/items/:itemId', uuidParam('id'), uuidParam('itemId'), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const logger = c.get('logger')
		const splitId = c.req.param('id')
		const itemId = c.req.param('itemId')

		logger.info('deleting item', { splitId, itemId, userId: authContext.userId })

		const split = await services.splits.deleteItem(splitId, itemId, authContext.userId)

		if (!split) {
			throw new NotFoundError('split or item not found')
		}

		return c.json(split)
	})
}
