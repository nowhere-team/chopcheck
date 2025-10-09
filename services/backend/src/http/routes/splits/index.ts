import { Hono } from 'hono'

import { auth } from '@/http/middleware/auth'

import { createAddItemsRoute } from './add-items'
import { createCreateSplitRoute } from './create'
import { createGetSplitRoute } from './get'
import { createJoinRoute } from './join'
import { createMyParticipationRoute } from './my-participation'
import { createMySplitsRoute } from './my-splits'
import { createSelectItemsRoute } from './select-items'
import { createUpdateSplitRoute } from './update'

export function createSplitsRoutes() {
	return new Hono()
		.route('/', createGetSplitRoute())

		.use('/*', auth())
		.route('/', createMySplitsRoute())
		.route('/', createJoinRoute())
		.route('/', createMyParticipationRoute())
		.route('/', createCreateSplitRoute())
		.route('/', createUpdateSplitRoute())
		.route('/', createAddItemsRoute())
		.route('/', createSelectItemsRoute())
}
