import { Hono } from 'hono'
import { z } from 'zod'
import { uuidParam, validate } from '@/http/utils'

const joinQuerySchema = z.object({
	anonymous: z
		.string()
		.optional()
		.transform(val => val === 'true'),
	display_name: z.string().min(1).max(255).optional(),
})

export function createJoinRoute() {
	return new Hono().get('/:id/join', uuidParam('id'), validate('query', joinQuerySchema), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const splitId = c.req.param('id')
		const { anonymous, display_name: displayName } = c.req.valid('query')

		const split = await services.splits.join(splitId, authContext.userId, {
			anonymous: anonymous ?? false,
			displayName,
		})

		return c.json(split)
	})
}
