import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { z } from 'zod'

import { auth } from '@/http/middleware/auth'
import { uuidParam, validate } from '@/http/utils'

const qrSchema = z.object({ qrRaw: z.string().min(10).max(512) })
const imageSchema = z.object({ image: z.string().min(100) })

export function createReceiptsRoutes() {
	const app = new Hono().use('/*', auth())

	app.get('/', async c => {
		const limit = parseInt(c.req.query('limit') || '20', 10)
		const offset = parseInt(c.req.query('offset') || '0', 10)
		const receipts = await c.get('services').receipts.listByUser(c.get('authContext')!.userId, { limit, offset })
		return c.json({ receipts, pagination: { limit, offset, hasMore: receipts.length === limit } })
	})

	app.get('/:id', uuidParam('id'), async c => {
		const receipt = await c.get('services').receipts.getById(c.req.param('id'), c.get('authContext')!.userId)
		if (!receipt) return c.json({ error: 'receipt not found' }, 404)
		return c.json(receipt)
	})

	app.post('/scan/qr', validate('json', qrSchema), async c => {
		const result = await c
			.get('services')
			.receipts.processQr(c.get('authContext')!.userId, c.req.valid('json').qrRaw, c.get('span'))
		return c.json({ success: true, ...result })
	})

	app.post('/scan/qr/stream', validate('json', qrSchema), async c => {
		const services = c.get('services')
		const userId = c.get('authContext')!.userId
		const span = c.get('span')
		const { qrRaw } = c.req.valid('json')

		return streamSSE(c, async stream => {
			const keepalive = setInterval(
				() => stream.writeSSE({ event: 'ping', data: JSON.stringify({ ts: Date.now() }) }),
				5000,
			)
			try {
				for await (const event of services.receipts.processQrStream(userId, qrRaw, span)) {
					await stream.writeSSE({ event: event.type, data: JSON.stringify(event.data) })
				}
			} finally {
				clearInterval(keepalive)
			}
		})
	})

	app.post('/scan/image', validate('json', imageSchema), async c => {
		const result = await c
			.get('services')
			.receipts.processImage(c.get('authContext')!.userId, c.req.valid('json').image, c.get('span'))
		return c.json({ success: true, ...result })
	})

	app.post('/scan/image/stream', validate('json', imageSchema), async c => {
		const services = c.get('services')
		const userId = c.get('authContext')!.userId
		const span = c.get('span')
		const { image } = c.req.valid('json')

		return streamSSE(c, async stream => {
			const keepalive = setInterval(
				() => stream.writeSSE({ event: 'ping', data: JSON.stringify({ ts: Date.now() }) }),
				5000,
			)
			try {
				for await (const event of services.receipts.processImageStream(userId, image, span)) {
					await stream.writeSSE({ event: event.type, data: JSON.stringify(event.data) })
				}
			} finally {
				clearInterval(keepalive)
			}
		})
	})

	return app
}
