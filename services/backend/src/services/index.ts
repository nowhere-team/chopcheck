import { AuthClient } from '@/platform/auth'
import type { Cache } from '@/platform/cache'
import type { Database } from '@/platform/database'
import type { Logger } from '@/platform/logger'
import { createRepositories } from '@/repositories'

import { CalculationService } from './calculation'
import { SplitsService } from './splits'
import { UsersService } from './users'

export interface Services {
	users: UsersService
	splits: SplitsService
}

export function createServices(auth: AuthClient, db: Database, cache: Cache, logger: Logger): Services {
	const repos = createRepositories(db, cache, logger)

	const users = new UsersService(repos.users, auth, logger.named('service/users'))
	const calc = new CalculationService(logger.named('service/calculation'))
	const splits = new SplitsService(
		repos.splits,
		repos.items,
		repos.participants,
		repos.paymentMethods,
		repos.stats,
		calc,
		logger.named('service/splits'),
	)

	return { users, splits }
}
