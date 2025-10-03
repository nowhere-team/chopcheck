import { Hono } from 'hono'

import { createDevRoutes } from '@/http/routes/dev'
import { createHealthRoutes } from '@/http/routes/health'
import { createSplitsRoutes } from '@/http/routes/splits'

export function registerRoutes() {
	return new Hono()
		.route('/health', createHealthRoutes())
		.route('/splits', createSplitsRoutes())
		.route('/dev', createDevRoutes())
}
