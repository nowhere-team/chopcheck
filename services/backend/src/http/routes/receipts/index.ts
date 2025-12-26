import { scanImageSchema, scanQrSchema } from '@chopcheck/shared'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'

import { auth } from '@/http/middleware/auth'
import { uuidParam, validate } from '@/http/utils'

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

	app.get('/:id/images', uuidParam('id'), async c => {
		const data = await c.get('services').receipts.getWithImages(c.req.param('id'), c.get('authContext')!.userId)
		if (!data) return c.json({ error: 'receipt not found' }, 404)
		return c.json({
			receiptId: data.receipt.id,
			imageMetadata: data.imageMetadata,
			savedImages: data.savedImages,
		})
	})

	app.post('/:id/images/refresh', uuidParam('id'), async c => {
		const savedImages = await c.get('services').receipts.refreshImageUrls(c.req.param('id'))
		return c.json({ success: true, savedImages })
	})

	app.post('/scan/qr', validate('json', scanQrSchema), async c => {
		const result = await c
			.get('services')
			.receipts.processQr(c.get('authContext')!.userId, c.req.valid('json').qrRaw, c.get('span'))
		return c.json({ success: true, ...result })
	})

	app.post('/scan/qr/stream', validate('json', scanQrSchema), async c => {
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

	app.post('/scan/image', validate('json', scanImageSchema), async c => {
		const { image, images, saveImages } = c.req.valid('json')
		const imageList = images ?? (image ? [image] : [])

		const result = await c
			.get('services')
			.receipts.processImages(c.get('authContext')!.userId, imageList, { saveImages })

		return c.json({ success: true, ...result })
	})

	app.post('/scan/image/stream', validate('json', scanImageSchema), async c => {
		const services = c.get('services')
		const userId = c.get('authContext')!.userId
		const { image, images, saveImages } = c.req.valid('json')
		const imageList = images ?? (image ? [image] : [])

		return streamSSE(c, async stream => {
			const keepalive = setInterval(
				() => stream.writeSSE({ event: 'ping', data: JSON.stringify({ ts: Date.now() }) }),
				5000,
			)
			try {
				for await (const event of services.receipts.processImagesStream(userId, imageList, { saveImages })) {
					await stream.writeSSE({ event: event.type, data: JSON.stringify(event.data) })
				}
			} finally {
				clearInterval(keepalive)
			}
		})
	})

	return app
}
