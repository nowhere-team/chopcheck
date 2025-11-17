import { Hono } from 'hono'

import { NotFoundError } from '@/common/errors'

export function createGetSplitByShortIdRoute() {
	return new Hono().get('/s/:shortId', async c => {
		const services = c.get('services')
		const shortId = c.req.param('shortId')

		const split = await services.splits.getByShortId(shortId, true)

		if (!split) {
			throw new NotFoundError('split not found')
		}

		return c.json(split)
	})
}
