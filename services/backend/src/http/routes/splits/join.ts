import { Hono } from 'hono'

import { uuidParam } from '@/http/utils'

export function createJoinRoute() {
	return new Hono().get('/:id/join', uuidParam('id'), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const splitId = c.req.param('id')

		const split = await services.splits.join(splitId, authContext.userId)

		return c.json(split)
	})
}
