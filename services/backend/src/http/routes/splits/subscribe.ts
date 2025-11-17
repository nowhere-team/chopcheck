import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'

export function createSplitSubscribeRoute() {
	return new Hono().get('/:id/subscribe', async c => {
		const services = c.get('services')
		const splitId = c.req.param('id')

		return streamSSE(c, async stream => {
			let lastUpdate: Date | null = null
			const intervalId = setInterval(async () => {
				try {
					const split = await services.splits.getById(splitId, true)

					if (!split) {
						await stream.writeSSE({
							data: JSON.stringify({ type: 'error', message: 'Split not found' }),
							event: 'error',
						})
						return
					}

					// Check if split has been updated since last check
					if (!lastUpdate || new Date(split.split.updatedAt) > lastUpdate) {
						lastUpdate = new Date(split.split.updatedAt)
						await stream.writeSSE({
							data: JSON.stringify({ type: 'update', split }),
							event: 'split-update',
						})
					}
				} catch (error) {
					console.error('Error in SSE stream:', error)
				}
			}, 2000) // Poll every 2 seconds

			// Send initial data
			try {
				const split = await services.splits.getById(splitId, true)
				if (split) {
					lastUpdate = new Date(split.split.updatedAt)
					await stream.writeSSE({
						data: JSON.stringify({ type: 'initial', split }),
						event: 'split-update',
					})
				}
			} catch (error) {
				console.error('Error sending initial data:', error)
			}

			// Cleanup on connection close
			c.req.raw.signal.addEventListener('abort', () => {
				clearInterval(intervalId)
			})
		})
	})
}
