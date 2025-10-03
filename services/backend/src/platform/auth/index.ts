import { AuthClient } from '@/platform/auth/client'
import type { Cache } from '@/platform/cache'
import type { Logger } from '@/platform/logger'

import type { AuthConfig } from './types'

export function createAuthClient(logger: Logger, cache: Cache, config: AuthConfig) {
	return new AuthClient(logger.named('auth'), cache, config)
}

export * from './client'
export * from './types'
