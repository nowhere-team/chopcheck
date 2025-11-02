import { Hono } from 'hono'

import { NotFoundError } from '@/common/errors'
import { uuidParam } from '@/http/utils'

export function createMyParticipationRoute() {
	return new Hono().get('/:id/my', uuidParam('id'), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const splitId = c.req.param('id')

		const participation = await services.splits.getMyParticipation(splitId, authContext.userId)

		if (!participation) {
			throw new NotFoundError('you are not a participant of this split')
		}

		return c.json(participation)
	})
}
