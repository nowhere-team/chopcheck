import { Hono } from 'hono'

import { createSplitSchema } from '@/common/types'
import { requirePermission } from '@/http/middleware/auth'
import { uuidParam, validate } from '@/http/utils'

export function createUpdateSplitRoute() {
	return new Hono().patch(
		'/:id',
		validate('json', createSplitSchema),
		requirePermission('splits:write'),
		uuidParam('id'),
		async c => {
			const authContext = c.get('authContext')!
			const services = c.get('services')
			const logger = c.get('logger')
			const splitId = c.req.param('id')

			const dto = c.req.valid('json')

			logger.info('updating split via PATCH api', {
				userId: authContext.userId,
				splitId,
				name: dto.name,
				itemsCount: dto.items?.length || 0,
			})

			const split = await services.splits.createOrUpdate(authContext.userId, { ...dto, id: splitId })

			return c.json(split)
		},
	)
}
