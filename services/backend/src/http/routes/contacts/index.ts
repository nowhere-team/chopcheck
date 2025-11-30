import { Hono } from 'hono'

import { auth } from '@/http/middleware/auth'

import { createGetContactRoute } from './get'
import { createListContactsRoute } from './list'

export function createContactsRoutes() {
	return new Hono().use('*', auth()).route('/', createListContactsRoute()).route('/', createGetContactRoute())
}
