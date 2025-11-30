import type { Logger } from '@/platform/logger'
import type { Tracer } from '@/platform/tracing'

import { CatalogClient } from './client'
import type { CatalogClientConfig } from './types'

export function createCatalogClient(config: CatalogClientConfig, logger: Logger, tracer: Tracer): CatalogClient {
	return new CatalogClient(config, logger.named('catalog'), tracer)
}

export { CatalogClient } from './client'
export * from './types'
