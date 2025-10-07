import { Hono } from 'hono'

import { createSplitSchema } from '@/common/types'
import { requirePermission } from '@/http/middleware/auth'

export function createCreateSplitRoute() {
	return new Hono().post('/', requirePermission('splits:create'), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const logger = c.get('logger')

		const body = await c.req.json()
		const dto = createSplitSchema.parse(body)

		logger.info('creating split via api', { userId: authContext.userId, name: dto.name })

		const split = await services.splits.create(authContext.userId, dto)

		return c.json(split, 201)
	})
}
