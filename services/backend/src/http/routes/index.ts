import { Hono } from 'hono'

import { createHealthRoutes } from '@/http/routes/health'

export function registerRoutes() {
	return new Hono().route('/health', createHealthRoutes())
}
