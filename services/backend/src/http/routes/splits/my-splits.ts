import { Hono } from 'hono'

export function createMySplitsRoute() {
	return new Hono().get('/my', async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')

		const splits = await services.splits.getMySplits(authContext.userId)

		return c.json({ splits })
	})
}
