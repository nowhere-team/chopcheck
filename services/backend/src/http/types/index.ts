import { AuthClient, type AuthContext } from '@/platform/auth'
import type { Cache } from '@/platform/cache'
import type { Database } from '@/platform/database'
import type { Logger } from '@/platform/logger'
import type { Services } from '@/services'

export interface ServerConfig {
	port: number
	development: boolean
	telegramToken: string
}

export interface ExternalDependencies {
	logger: Logger
	auth: AuthClient
	database: Database
	cache: Cache
	services: Services
	config: ServerConfig
}

export interface ContainerContext extends ExternalDependencies {
	authContext?: AuthContext
}

declare module 'hono' {
	// eslint-disable-next-line
	interface ContextVariableMap extends ContainerContext {}
}
