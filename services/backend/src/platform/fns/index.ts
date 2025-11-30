import type { Logger } from '@/platform/logger'
import type { Tracer } from '@/platform/tracing'

import { FnsClient } from './client'
import type { FnsClientConfig } from './types'

export function createFnsClient(config: FnsClientConfig, logger: Logger, tracer: Tracer): FnsClient {
	return new FnsClient(config, logger.named('fns'), tracer)
}

export { FnsClient } from './client'
export * from './types'
