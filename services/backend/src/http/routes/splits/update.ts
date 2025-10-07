import { Hono } from 'hono'
import { z } from 'zod'

import { requirePermission } from '@/http/middleware/auth'
import { uuidParam } from '@/http/utils'

const updateSplitSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	currency: z.string().length(3).optional(),
})

export function createUpdateSplitRoute() {
	return new Hono().patch('/:id', requirePermission('splits:update'), uuidParam('id'), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const splitId = c.req.param('id')

		const body = await c.req.json()
		const data = updateSplitSchema.parse(body)

		const split = await services.splits.updateSplit(splitId, authContext.userId, data)

		return c.json(split)
	})
}
