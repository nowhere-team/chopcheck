import { Hono } from 'hono'

import { auth } from '@/http/middleware/auth'

import { createAddItemsRoute } from './add-items'
import { createAddPaymentMethodToSplitRoute } from './add-payment-method'
import { createCreateSplitRoute } from './create'
import { createDeleteItemRoute } from './delete-item'
import { createDraftRoute } from './draft'
import { createGetSplitRoute } from './get'
import { createGetSplitByShortIdRoute } from './get-by-short-id'
import { createJoinRoute } from './join'
import { createListSplitPaymentMethodsRoute } from './list-payment-methods'
import { createMyParticipationRoute } from './my-participation'
import { createMySplitsRoute } from './my-splits'
import { createPublishRoute } from './publish'
import { createRemovePaymentMethodFromSplitRoute } from './remove-payment-method'
import { createSelectItemsRoute } from './select-items'
import { createSplitSubscribeRoute } from './subscribe'
import { createUpdateSplitRoute } from './update'
import { createUpdateItemRoute } from './update-item'

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
		.route('/', createDraftRoute())
		.route('/', createPublishRoute())
}

function createPublicSplitsRoutes() {
	return new Hono()
		.route('/', createGetSplitRoute())
		.route('/', createGetSplitByShortIdRoute())
		.route('/', createSplitSubscribeRoute())
}

export function createSplitsRoutes() {
	return new Hono().route('/', createPrivateSplitsRoutes()).route('/', createPublicSplitsRoutes())
}
