import { Hono } from 'hono'

import { createAuthRoutes } from './auth'
import { createContactsRoutes } from './contacts'
import { createDevRoutes } from './dev'
import { createHealthRoutes } from './health'
import { createPaymentMethodsRoutes } from './payment-methods'
import { createReceiptsRoutes } from './receipts'
import { createSplitsRoutes } from './splits'

export function registerRoutes() {
	return new Hono()
		.route('/health', createHealthRoutes())
		.route('/auth', createAuthRoutes())
		.route('/splits', createSplitsRoutes())
		.route('/receipts', createReceiptsRoutes())
		.route('/payment-methods', createPaymentMethodsRoutes())
		.route('/contacts', createContactsRoutes())
		.route('/dev', createDevRoutes())
}
