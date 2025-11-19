import { Hono } from 'hono'

import { NotFoundError } from '@/common/errors'
import { anonymizeSplitResponse, uuidParam } from '@/http/utils'

export function createGetSplitRoute() {
	return new Hono().get('/:id', uuidParam('id'), async c => {
		const services = c.get('services')
		const splitId = c.req.param('id')

		const split = await services.splits.getById(splitId, true)

		if (!split) {
			throw new NotFoundError('split not found')
		}

		return c.json(anonymizeSplitResponse(split))
	})
}
