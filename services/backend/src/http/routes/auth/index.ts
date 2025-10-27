import { Hono } from 'hono'

import { createMeRoute } from './me'
import { createStatsRoute } from './stats'
import { createTelegramAuthRoute } from './telegram'

export function createAuthRoutes() {
	return new Hono().route('/', createTelegramAuthRoute()).route('/', createMeRoute()).route('/', createStatsRoute())
}
