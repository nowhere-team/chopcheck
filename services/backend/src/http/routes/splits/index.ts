import { Hono } from 'hono'

import { auth, optionalAuth } from '@/http/middleware/auth'

import { createAddItemsRoute } from './add-items'
import { createCreateSplitRoute } from './create'
import { createGetSplitRoute } from './get'
import { createJoinRoute } from './join'
import { createMyParticipationRoute } from './my-participation'
import { createMySplitsRoute } from './my-splits'
import { createSelectItemsRoute } from './select-items'
import { createUpdateSplitRoute } from './update'
import { createDeleteItemRoute } from '@/http/routes/splits/delete-item'
import { createUpdateItemRoute } from '@/http/routes/splits/update-item'
import { createAddPaymentMethodToSplitRoute } from '@/http/routes/splits/add-payment-method'
import { createRemovePaymentMethodFromSplitRoute } from '@/http/routes/splits/remove-payment-method'
import { createListSplitPaymentMethodsRoute } from '@/http/routes/splits/list-payment-methods'

function createPrivateSplitsRoutes() {
	return new Hono()
		.use('/*', auth())
		.route('/', createMySplitsRoute())
		.route('/', createMyParticipationRoute())
		.route('/', createCreateSplitRoute())
		.route('/', createUpdateSplitRoute())
		.route('/', createAddItemsRoute())
		.route('/', createDeleteItemRoute())
		.route('/', createUpdateItemRoute())
		.route('/', createListSplitPaymentMethodsRoute())
		.route('/', createAddPaymentMethodToSplitRoute())
		.route('/', createRemovePaymentMethodFromSplitRoute())
}

function createPublicSplitsRoutes() {
	return new Hono().route('/', createGetSplitRoute())
}

function createMixedAuthSplitsRoutes() {
	return new Hono()
		.use('/*', optionalAuth())
		.route('/', createJoinRoute())
		.route('/', createSelectItemsRoute())
}

export function createSplitsRoutes() {
	return new Hono()
		.route('/', createPrivateSplitsRoutes())
		.route('/', createMixedAuthSplitsRoutes())
		.route('/', createPublicSplitsRoutes())
}
