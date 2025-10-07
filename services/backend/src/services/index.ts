import type { Cache } from '@/platform/cache'
import type { Database } from '@/platform/database'
import type { Logger } from '@/platform/logger'
import { createRepositories } from '@/repositories'

import { CalculationService } from './calculation'
import { SplitsService } from './splits'

export interface Services {
	splits: SplitsService
}

export function createServices(db: Database, cache: Cache, logger: Logger): Services {
	const repos = createRepositories(db, cache, logger)

	const calc = new CalculationService(logger.named('service/calculation'))
	const splits = new SplitsService(repos.splits, repos.items, repos.participants, calc, logger.named('service/splits'))

	return { splits }
}
