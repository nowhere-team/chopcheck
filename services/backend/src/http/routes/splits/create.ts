import { Hono } from 'hono'

import { createSplitSchema } from '@/common/types'
import { requirePermission } from '@/http/middleware/auth'
import { validate } from '@/http/utils'

export function createCreateSplitRoute() {
	return new Hono().post('/', validate('json', createSplitSchema), requirePermission('splits:create'), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const logger = c.get('logger')

		const dto = c.req.valid('json')

		logger.info('creating split via api', { userId: authContext.userId, name: dto.name })

		const split = await services.splits.create(authContext.userId, dto)

		return c.json(split, 201)
	})
}
