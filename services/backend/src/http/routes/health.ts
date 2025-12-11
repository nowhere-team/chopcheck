import { Hono } from 'hono'

export function createHealthRoutes() {
	return new Hono()
		.get('/', c => c.json({ status: 'ok', timestamp: Date.now(), traceId: c.get('traceId') }))
		.get('/fns', c => c.json({ status: 'ok', tokens: c.get('fns').getTokenStats() }))
}
