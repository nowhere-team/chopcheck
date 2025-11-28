import { AuthClient, type AuthContext } from '@/platform/auth'
import type { Database } from '@/platform/database'
import type { Logger } from '@/platform/logger'
import { TelegramServiceClient } from '@/platform/telegram'
import type { Services } from '@/services'

export interface ServerConfig {
	port: number
	development: boolean
	telegramToken: string
	webAppUrl: string
}

export interface ExternalDependencies {
	logger: Logger
	auth: AuthClient
	telegram: TelegramServiceClient
	database: Database
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
