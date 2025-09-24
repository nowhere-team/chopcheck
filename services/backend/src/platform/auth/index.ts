import type { Logger } from '@/platform/logger'

import { AuthClient } from './client'
import type { AuthConfig } from './types'

export function createAuthClient(logger: Logger, config: AuthConfig): AuthClient {
	return new AuthClient(config, logger.named('auth'))
}

export * from './client'
export * from './types'
