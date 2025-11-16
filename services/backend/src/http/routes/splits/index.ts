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
import { createDeleteItemRoute } from '@/http/routes/splits/delete-item'
import { createUpdateItemRoute } from '@/http/routes/splits/update-item'
import { createAddPaymentMethodToSplitRoute } from '@/http/routes/splits/add-payment-method'
import { createRemovePaymentMethodFromSplitRoute } from '@/http/routes/splits/remove-payment-method'
import { createListSplitPaymentMethodsRoute } from '@/http/routes/splits/list-payment-methods'

function createPrivateSplitsRoutes() {
	return new Hono()
		.use('/*', auth())
		.route('/', createMySplitsRoute())
		.route('/', createJoinRoute())
		.route('/', createMyParticipationRoute())
		.route('/', createCreateSplitRoute())
		.route('/', createUpdateSplitRoute())
		.route('/', createAddItemsRoute())
		.route('/', createSelectItemsRoute())
		.route('/', createDeleteItemRoute())
		.route('/', createUpdateItemRoute())
		.route('/', createListSplitPaymentMethodsRoute())
		.route('/', createAddPaymentMethodToSplitRoute())
		.route('/', createRemovePaymentMethodFromSplitRoute())
}

function createPublicSplitsRoutes() {
	return new Hono().route('/', createGetSplitRoute())
}

export function createSplitsRoutes() {
	return new Hono().route('/', createPrivateSplitsRoutes()).route('/', createPublicSplitsRoutes())
}
