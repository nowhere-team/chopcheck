import { AuthClient, type AuthContext } from '@/platform/auth'
import type { Logger } from '@/platform/logger'

export interface ExternalDependencies {
	logger: Logger
	auth: AuthClient
}

export interface ContainerContext extends ExternalDependencies {
	authContext?: AuthContext
}

declare module 'hono' {
	// eslint-disable-next-line
	interface ContextVariableMap extends ContainerContext {}
}
