import { AuthClient, type AuthContext } from '@/platform/auth'
import type { Database } from '@/platform/database'
import type { Logger } from '@/platform/logger'
import type { Services } from '@/services'

export interface ExternalDependencies {
	logger: Logger
	auth: AuthClient
	database: Database
	services: Services
}

export interface ContainerContext extends ExternalDependencies {
	authContext?: AuthContext
}

declare module 'hono' {
	// eslint-disable-next-line
	interface ContextVariableMap extends ContainerContext {}
}
