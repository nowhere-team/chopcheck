import { Hono } from 'hono'

export function createDraftRoute() {
	return new Hono().get('/draft', async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')

		const draft = await services.splits.getDraft(authContext.userId)

		if (!draft) {
			return c.json({ error: 'draft not found' }, 404)
		}

		return c.json(draft)
	})
}
