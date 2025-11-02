import { Hono } from 'hono'
import { z } from 'zod'

const querySchema = z.object({
	grouped: z.coerce.boolean().default(false),
	offset: z.coerce.number().int().min(0).default(0),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	status: z.enum(['draft', 'active', 'completed']).optional(),
	period: z.enum(['earlier']).optional(),
})

export function createMySplitsRoute() {
	return new Hono().get('/my', async c => {
		const authContext = c.get('authContext')!
		const services = c.get('services')

		const query = querySchema.parse(c.req.query())

		// period sorting
		if (query.grouped) {
			const splits = await services.splits.getMySplitsGrouped(authContext.userId)
			return c.json(splits)
		}

		// certain period for pagination
		if (query.period === 'earlier') {
			const splits = await services.splits.getEarlierSplits(authContext.userId, query.offset, query.limit)
			return c.json({
				splits,
				pagination: {
					offset: query.offset,
					limit: query.limit,
					hasMore: splits.length === query.limit,
				},
			})
		}

		// default query
		const splits = await services.splits.getMySplits(authContext.userId, {
			offset: query.offset,
			limit: query.limit,
			status: query.status,
		})

		return c.json({
			splits,
			pagination: {
				offset: query.offset,
				limit: query.limit,
				hasMore: splits.length === query.limit,
			},
		})
	})
}
