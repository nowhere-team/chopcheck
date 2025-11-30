import { Hono } from 'hono'
import { z } from 'zod'

const querySchema = z.object({
	query: z.string().optional(),
	limit: z.coerce.number().int().min(1).max(100).default(50),
	offset: z.coerce.number().int().min(0).default(0),
	sortBy: z.enum(['recent', 'frequent', 'name']).default('recent'),
})

export function createListContactsRoute() {
	return new Hono().get('/', async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const logger = c.get('logger')

		const query = querySchema.parse(c.req.query())

		logger.debug('listing contacts', { userId: authContext.userId, query })

		const contacts = await services.contacts.getMyContacts(authContext.userId, query)

		return c.json({
			success: true,
			data: contacts,
			pagination: {
				offset: query.offset,
				limit: query.limit,
				hasMore: contacts.length === query.limit,
			},
		})
	})
}
