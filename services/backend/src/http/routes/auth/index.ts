import { Hono } from 'hono'

import { createMeRoute } from './me'
import { createTelegramAuthRoute } from './telegram'

export function createAuthRoutes() {
	return new Hono().route('/', createTelegramAuthRoute()).route('/', createMeRoute())
}
