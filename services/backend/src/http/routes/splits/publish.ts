import { Hono } from 'hono'

import { requirePermission } from '@/http/middleware/auth'
import { anonymizeSplitResponse, uuidParam } from '@/http/utils'

export function createPublishRoute() {
	return new Hono().post('/:id/publish', requirePermission('splits:write'), uuidParam('id'), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const splitId = c.req.param('id')

		const split = await services.splits.publishDraft(splitId, authContext.userId)

		return c.json(anonymizeSplitResponse(split))
	})
}
