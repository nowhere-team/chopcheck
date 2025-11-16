import { Hono } from 'hono'
import { z } from 'zod'

import { anonymizeSplitResponse, uuidParam, validate } from '@/http/utils'

const joinQuerySchema = z.object({
	anonymous: z
		.string()
		.optional()
		.transform(val => val === 'true'),
	displayName: z.string().optional(),
})

export function createJoinRoute() {
	return new Hono().get('/:id/join', uuidParam('id'), validate('query', joinQuerySchema), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const splitId = c.req.param('id')
		const { anonymous, displayName } = c.req.valid('query')

		const split = await services.splits.join(splitId, authContext.userId, displayName, anonymous || false)

		// Anonymize participants in response
		return c.json(anonymizeSplitResponse(split))
	})
}
