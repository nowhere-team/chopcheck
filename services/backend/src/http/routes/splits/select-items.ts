import { Hono } from 'hono'
import { z } from 'zod'

import { NotFoundError } from '@/common/errors'
import { anonymizeSplitResponse, uuidParam, validate } from '@/http/utils'

const selectItemsSchema = z.object({
	participantId: z.uuid().optional(),
	selections: z.array(
		z.object({
			itemId: z.uuid(),
			divisionMethod: z.enum(['equal', 'shares', 'fixed', 'proportional', 'custom']),
			value: z.string().optional(),
		}),
	),
})

export function createSelectItemsRoute() {
	return new Hono().post('/:id/select', uuidParam('id'), validate('json', selectItemsSchema), async c => {
		const services = c.get('services')
		const authContext = c.get('authContext')!
		const splitId = c.req.param('id')

		const { participantId: requestedParticipantId, selections } = c.req.valid('json')

		const participantId =
			requestedParticipantId ??
			(await (async () => {
				const participation = await services.splits.getMyParticipation(splitId, authContext.userId)
				if (!participation) {
					throw new NotFoundError('participant not found in this split')
				}
				return participation.participant.id
			})())

		const split = await services.splits.selectItems(splitId, participantId, selections)
		return c.json(anonymizeSplitResponse(split))
	})
}
