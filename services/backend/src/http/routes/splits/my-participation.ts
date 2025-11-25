import { Hono } from 'hono'

import { uuidParam } from '@/http/utils'

export function createMyParticipationRoute() {
	return new Hono().get('/:id/my', uuidParam('id'), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const splitId = c.req.param('id')

		const participation = await services.splits.getMyParticipation(splitId, authContext.userId)

		return c.json({ participation })
	})
}
