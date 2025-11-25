import { Hono } from 'hono'

import { NotFoundError } from '@/common/errors'
import { requirePermission } from '@/http/middleware/auth'
import { uuidParam } from '@/http/utils'

export function createShareRoute() {
	return new Hono().post('/:id/share', requirePermission('splits:read'), uuidParam('id'), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const telegram = c.get('telegram')
		const logger = c.get('logger')
		const splitId = c.req.param('id')

		const data = await services.splits.getById(splitId, false)
		if (!data || !data.split.shortId) {
			throw new NotFoundError('split not found')
		}

		const { split } = data

		const user = await services.users.getById(authContext.userId)
		if (!user?.telegramId) {
			return c.json({ error: 'telegram id not found' }, 400)
		}

		logger.info('creating share message', {
			splitId,
			userId: authContext.userId,
			telegramId: user.telegramId,
		})

		const preparedMessageId = await telegram.createShareMessage(
			user.telegramId,
			split.name,
			split.shortId!,
			c.get('config').webAppUrl,
		)

		return c.json({
			preparedMessageId,
			splitId: split.id,
			shortId: split.shortId,
		})
	})
}
