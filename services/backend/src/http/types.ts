import type { AuthClient, AuthContext } from '@/platform/auth'
import type { CatalogClient } from '@/platform/catalog'
import type { Database } from '@/platform/database'
import type { FnsClient } from '@/platform/fns'
import type { Logger } from '@/platform/logger'
import type { TelegramServiceClient } from '@/platform/telegram'
import type { SpanContext, Tracer } from '@/platform/tracing'
import type { Services } from '@/services'

export interface ServerConfig {
	port: number
	development: boolean
	telegramToken: string
	webAppUrl: string
}

export interface ExternalDependencies {
	logger: Logger
	tracer: Tracer
	auth: AuthClient
	telegram: TelegramServiceClient
	fns: FnsClient
	catalog: CatalogClient
	database: Database
	services: Services
	config: ServerConfig
}

export interface RequestContext extends ExternalDependencies {
	authContext?: AuthContext
	span?: SpanContext
	traceId?: string
}

declare module 'hono' {
	// noinspection JSUnusedGlobalSymbols
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface ContextVariableMap extends RequestContext {}
}
