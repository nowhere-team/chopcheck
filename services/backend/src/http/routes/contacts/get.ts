import { Hono } from 'hono'

import { NotFoundError } from '@/common/errors'
import { uuidParam } from '@/http/utils'

export function createGetContactRoute() {
	return new Hono().get('/:contactId', uuidParam('contactId'), async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')
		const contactId = c.req.param('contactId')

		const contact = await services.contacts.getContactWithFinance(authContext.userId, contactId)

		if (!contact) {
			throw new NotFoundError('contact not found')
		}

		return c.json({ success: true, data: contact })
	})
}
