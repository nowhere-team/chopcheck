import { AuthClient } from '@/platform/auth'
import type { Cache } from '@/platform/cache'
import type { Database } from '@/platform/database'
import type { Logger } from '@/platform/logger'
import { createRepositories } from '@/repositories'

import { CalculationService } from './calculation'
import { ContactsService } from './contacts'
import { PaymentMethodsService } from './payment-methods'
import { SplitsService } from './splits'
import { UsersService } from './users'

export interface Services {
	users: UsersService
	splits: SplitsService
	paymentMethods: PaymentMethodsService
	contacts: ContactsService
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
		repos.contacts,
		calc,
		logger.named('service/splits'),
	)
	const paymentMethods = new PaymentMethodsService(repos.paymentMethods, logger.named('service/payment-methods'))
	const contacts = new ContactsService(repos.contacts, logger.named('service/contacts'))

	return { users, splits, paymentMethods, contacts }
}
