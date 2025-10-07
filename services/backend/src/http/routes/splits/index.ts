import { Hono } from 'hono'

import { auth } from '@/http/middleware/auth'

import { createAddItemsRoute } from './add-items'
import { createCreateSplitRoute } from './create'
import { createGetSplitRoute } from './get'
import { createSelectItemsRoute } from './select-items'
import { createUpdateSplitRoute } from './update'

export function createSplitsRoutes() {
	return (
		new Hono()
			// public endpoint - get split
			.route('/', createGetSplitRoute())

			// protected endpoints
			.use('/*', auth())
			.route('/', createCreateSplitRoute())
			.route('/', createUpdateSplitRoute())
			.route('/', createAddItemsRoute())
			.route('/', createSelectItemsRoute())
	)
}
