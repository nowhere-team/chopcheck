import type { Logger } from '@/platform/logger'

export interface ExternalDependencies {
	logger: Logger
}

export interface ContainerContext extends ExternalDependencies {}

declare module 'hono' {
	// eslint-disable-next-line
	interface ContextVariableMap extends ContainerContext {}
}
