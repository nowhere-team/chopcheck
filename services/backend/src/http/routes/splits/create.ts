import { Hono } from 'hono'

import { createSplitSchema } from '@/common/types'
import { requirePermission } from '@/http/middleware/auth'
import { anonymizeSplitResponse, validate } from '@/http/utils'

export function createCreateSplitRoute() {
	return new Hono().post('/', validate('json', createSplitSchema), requirePermission('splits:create'), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const logger = c.get('logger')

		const dto = c.req.valid('json')

		logger.info('creating or updating split via api', {
			userId: authContext.userId,
			name: dto.name,
			isUpdate: !!dto.id,
		})

		const split = await services.splits.createOrUpdate(authContext.userId, dto)

		return c.json(anonymizeSplitResponse(split), dto.id ? 200 : 201)
	})
}
