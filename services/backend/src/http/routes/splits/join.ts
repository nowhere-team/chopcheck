import { Hono } from 'hono'
import { z } from 'zod'

import { uuidParam, validate } from '@/http/utils'

const joinQuerySchema = z.object({
	anonymous: z
		.string()
		.optional()
		.transform(val => val === 'true'),
	displayName: z.string().optional(),
})

export function createJoinRoute() {
	return new Hono().get('/:id/join', uuidParam('id'), validate('query', joinQuerySchema), async c => {
		const authContext = c.get('authContext')
		const services = c.get('services')
		const splitId = c.req.param('id')
		const { anonymous, displayName } = c.req.valid('query')

		// If user is not authenticated OR explicitly requested anonymous join
		const isAnonymous = !authContext || anonymous

		const split = await services.splits.join(splitId, isAnonymous ? null : authContext.userId, displayName, isAnonymous)

		return c.json(split)
	})
}
