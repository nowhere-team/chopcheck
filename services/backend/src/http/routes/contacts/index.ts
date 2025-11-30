import { Hono } from 'hono'
import { z } from 'zod'

import { NotFoundError } from '@/common/errors'
import { auth } from '@/http/middleware/auth'
import { uuidParam } from '@/http/utils'

const querySchema = z.object({
	query: z.string().optional(),
	limit: z.coerce.number().int().min(1).max(100).default(50),
	offset: z.coerce.number().int().min(0).default(0),
	sortBy: z.enum(['recent', 'frequent', 'name']).default('recent'),
})

export function createContactsRoutes() {
	const app = new Hono().use('/*', auth())

	app.get('/', async c => {
		const query = querySchema.parse(c.req.query())
		const contacts = await c.get('services').contacts.getMyContacts(c.get('authContext')!.userId, query)
		return c.json({
			success: true,
			data: contacts,
			pagination: { offset: query.offset, limit: query.limit, hasMore: contacts.length === query.limit },
		})
	})

	app.get('/:contactId', uuidParam('contactId'), async c => {
		const contact = await c
			.get('services')
			.contacts.getContactWithFinance(c.get('authContext')!.userId, c.req.param('contactId'))
		if (!contact) throw new NotFoundError('contact not found')
		return c.json({ success: true, data: contact })
	})

	return app
}
