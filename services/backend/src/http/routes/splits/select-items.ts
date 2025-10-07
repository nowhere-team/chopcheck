import { Hono } from 'hono'
import { z } from 'zod'

import { uuidParam } from '@/http/utils'

const selectItemsSchema = z.object({
	participantId: z.uuid(),
	selections: z.array(
		z.object({
			itemId: z.uuid(),
			divisionMethod: z.enum(['equal', 'shares', 'fixed', 'proportional', 'custom']),
			value: z.string().optional(),
		}),
	),
})

export function createSelectItemsRoute() {
	return new Hono().post('/:id/select', uuidParam('id'), async c => {
		const services = c.get('services')
		const splitId = c.req.param('id')

		const body = await c.req.json()
		const { participantId, selections } = selectItemsSchema.parse(body)

		const split = await services.splits.selectItems(splitId, participantId, selections)

		return c.json(split)
	})
}
