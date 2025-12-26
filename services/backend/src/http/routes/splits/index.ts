// file: services/backend/src/http/routes/splits/index.ts
import {
	addPaymentMethodToSplitSchema,
	createItemGroupSchema,
	createSplitSchema,
	selectItemsSchema,
	splitItemSchema,
	updateItemGroupSchema,
	updateItemSchema,
} from '@chopcheck/shared'
import { Hono } from 'hono'
import { z } from 'zod'

import { NotFoundError } from '@/common/errors'
import { auth, requirePermission } from '@/http/middleware/auth'
import { anonymizeSplitResponse, uuidParam, validate } from '@/http/utils'

const joinQuerySchema = z.object({
	anonymous: z
		.enum(['true', 'false'])
		.optional()
		.transform(v => v === 'true'),
	display_name: z.string().min(1).max(255).optional(),
})

const mySplitsQuerySchema = z.object({
	grouped: z.coerce.boolean().default(false),
	offset: z.coerce.number().int().min(0).default(0),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	status: z.enum(['draft', 'active', 'completed']).optional(),
	period: z.enum(['earlier']).optional(),
})

const addItemsSchema = z.object({
	items: z.array(
		splitItemSchema.omit({ id: true, groupId: true }).extend({
			groupId: z.string().uuid().optional(),
		}),
	),
})

export function createSplitsRoutes() {
	const app = new Hono()

	// protected
	app.use('/*', auth())

	app.get('/s/:shortId', async c => {
		const split = await c.get('services').splits.getByShortId(c.req.param('shortId'), true)
		if (!split) throw new NotFoundError('split not found')
		return c.json(split)
	})

	app.get('/my', validate('query', mySplitsQuerySchema), async c => {
		const userId = c.get('authContext')!.userId
		const services = c.get('services')
		const q = c.req.valid('query')

		if (q.grouped) return c.json(await services.splits.getMySplitsGrouped(userId))
		if (q.period === 'earlier') {
			const splits = await services.splits.getEarlierSplits(userId, q.offset, q.limit)
			return c.json({
				splits,
				pagination: { offset: q.offset, limit: q.limit, hasMore: splits.length === q.limit },
			})
		}

		const splits = await services.splits.getMySplits(userId, { offset: q.offset, limit: q.limit, status: q.status })
		return c.json({ splits, pagination: { offset: q.offset, limit: q.limit, hasMore: splits.length === q.limit } })
	})

	app.get('/draft', async c => {
		const draft = await c.get('services').splits.getDraft(c.get('authContext')!.userId)
		if (!draft) return c.json({ error: 'draft not found' }, 404)
		return c.json(anonymizeSplitResponse(draft))
	})

	app.post('/', validate('json', createSplitSchema), requirePermission('splits:create'), async c => {
		const split = await c.get('services').splits.createOrUpdate(c.get('authContext')!.userId, c.req.valid('json'))
		return c.json(anonymizeSplitResponse(split), 201)
	})

	app.get('/:id', uuidParam('id'), async c => {
		const split = await c.get('services').splits.getById(c.req.param('id'), true)
		if (!split) throw new NotFoundError('split not found')
		return c.json(anonymizeSplitResponse(split))
	})

	app.patch(
		'/:id',
		uuidParam('id'),
		validate('json', createSplitSchema),
		requirePermission('splits:write'),
		async c => {
			const split = await c
				.get('services')
				.splits.createOrUpdate(c.get('authContext')!.userId, { ...c.req.valid('json'), id: c.req.param('id') })
			return c.json(anonymizeSplitResponse(split))
		},
	)

	app.post('/:id/publish', uuidParam('id'), requirePermission('splits:write'), async c => {
		const split = await c.get('services').splits.publish(c.req.param('id'), c.get('authContext')!.userId)
		return c.json(anonymizeSplitResponse(split))
	})

	app.get('/:id/join', uuidParam('id'), validate('query', joinQuerySchema), async c => {
		const q = c.req.valid('query')
		const split = await c
			.get('services')
			.splits.join(c.req.param('id'), c.get('authContext')!.userId, q.display_name, q.anonymous)
		return c.json(anonymizeSplitResponse(split))
	})

	app.get('/:id/my', uuidParam('id'), async c => {
		const participation = await c
			.get('services')
			.splits.getMyParticipation(c.req.param('id'), c.get('authContext')!.userId)
		return c.json({ participation })
	})

	app.post('/:id/items', uuidParam('id'), validate('json', addItemsSchema), async c => {
		const split = await c
			.get('services')
			.splits.addItems(c.req.param('id'), c.get('authContext')!.userId, c.req.valid('json').items)
		return c.json(anonymizeSplitResponse(split))
	})

	app.patch('/:id/items/:itemId', uuidParam('id', 'itemId'), validate('json', updateItemSchema), async c => {
		const split = await c
			.get('services')
			.splits.updateItem(
				c.req.param('id'),
				c.req.param('itemId'),
				c.get('authContext')!.userId,
				c.req.valid('json'),
			)
		return c.json(anonymizeSplitResponse(split))
	})

	app.delete('/:id/items/:itemId', uuidParam('id', 'itemId'), async c => {
		const split = await c
			.get('services')
			.splits.deleteItem(c.req.param('id'), c.req.param('itemId'), c.get('authContext')!.userId)
		return c.json(anonymizeSplitResponse(split))
	})

	app.post('/:id/select', uuidParam('id'), validate('json', selectItemsSchema), async c => {
		const { participantId, selections } = c.req.valid('json')
		const services = c.get('services')
		const userId = c.get('authContext')!.userId
		const splitId = c.req.param('id')

		const pid = participantId ?? (await services.splits.getMyParticipation(splitId, userId))?.participant.id
		if (!pid) throw new NotFoundError('participant not found')

		const split = await services.splits.selectItems(splitId, pid, selections)
		return c.json(anonymizeSplitResponse(split))
	})

	app.get('/:id/payment-methods', uuidParam('id'), async c => {
		const methods = await c.get('services').splits.getSplitPaymentMethods(c.req.param('id'))
		return c.json({ success: true, data: methods })
	})

	app.post('/:id/payment-methods', uuidParam('id'), validate('json', addPaymentMethodToSplitSchema), async c => {
		await c
			.get('services')
			.splits.addPaymentMethod(c.req.param('id'), c.get('authContext')!.userId, c.req.valid('json'))
		return c.json({ success: true }, 201)
	})

	app.delete('/:id/payment-methods/:paymentMethodId', uuidParam('id', 'paymentMethodId'), async c => {
		await c
			.get('services')
			.splits.removePaymentMethod(c.req.param('id'), c.req.param('paymentMethodId'), c.get('authContext')!.userId)
		return c.json({ success: true })
	})

	app.post('/:id/receipts/:receiptId', uuidParam('id', 'receiptId'), async c => {
		const split = await c
			.get('services')
			.splits.linkReceipt(c.req.param('id'), c.req.param('receiptId'), c.get('authContext')!.userId)
		return c.json(anonymizeSplitResponse(split))
	})

	app.delete('/:id/receipts/:receiptId', uuidParam('id', 'receiptId'), async c => {
		const split = await c
			.get('services')
			.splits.unlinkReceipt(c.req.param('id'), c.req.param('receiptId'), c.get('authContext')!.userId)
		return c.json(anonymizeSplitResponse(split))
	})

	app.post('/:id/share', uuidParam('id'), requirePermission('splits:read'), async c => {
		const services = c.get('services')
		const telegram = c.get('telegram')
		const config = c.get('config')
		const userId = c.get('authContext')!.userId
		const splitId = c.req.param('id')

		const data = await services.splits.getById(splitId, false)
		if (!data?.split.shortId) throw new NotFoundError('split not found')

		const user = await services.users.getById(userId)
		if (!user?.telegramId) return c.json({ error: 'telegram id not found' }, 400)

		const preparedMessageId = await telegram.createShareMessage(
			user.telegramId,
			data.split.name,
			data.split.shortId,
			config.webAppUrl,
		)

		return c.json({ preparedMessageId, splitId: data.split.id, shortId: data.split.shortId })
	})

	app.post('/:id/groups', uuidParam('id'), validate('json', createItemGroupSchema), async c => {
		const split = await c
			.get('services')
			.splits.createItemGroup(c.req.param('id'), c.get('authContext')!.userId, c.req.valid('json'))
		return c.json(anonymizeSplitResponse(split), 201)
	})

	app.patch('/:id/groups/:groupId', uuidParam('id', 'groupId'), validate('json', updateItemGroupSchema), async c => {
		const split = await c
			.get('services')
			.splits.updateItemGroup(
				c.req.param('id'),
				c.req.param('groupId'),
				c.get('authContext')!.userId,
				c.req.valid('json'),
			)
		return c.json(anonymizeSplitResponse(split))
	})

	app.delete('/:id/groups/:groupId', uuidParam('id', 'groupId'), async c => {
		const split = await c
			.get('services')
			.splits.deleteItemGroup(c.req.param('id'), c.req.param('groupId'), c.get('authContext')!.userId)
		return c.json(anonymizeSplitResponse(split))
	})

	return app
}
