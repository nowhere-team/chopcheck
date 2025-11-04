import { Hono } from 'hono'

import { auth } from '@/http/middleware/auth'

import { createCreatePaymentMethodRoute } from './create'
import { createDeletePaymentMethodRoute } from './delete'
import { createListPaymentMethodsRoute } from './list'
import { createUpdatePaymentMethodRoute } from './update'

export function createPaymentMethodsRoutes() {
	return new Hono()
		.use('*', auth())
		.route('/', createListPaymentMethodsRoute())
		.route('/', createCreatePaymentMethodRoute())
		.route('/', createUpdatePaymentMethodRoute())
		.route('/', createDeletePaymentMethodRoute())
}
