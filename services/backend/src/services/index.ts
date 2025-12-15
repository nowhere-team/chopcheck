import type { AuthClient } from '@/platform/auth'
import type { Cache } from '@/platform/cache'
import type { CatalogClient } from '@/platform/catalog'
import type { Database } from '@/platform/database'
import type { FnsClient } from '@/platform/fns'
import type { Logger } from '@/platform/logger'
import { createRepositories } from '@/repositories'

import { CalculationService } from './calculation'
import { ContactsService } from './contacts'
import { PaymentMethodsService } from './payment-methods'
import { ReceiptsService } from './receipts'
import { SplitsService } from './splits'
import { UsersService } from './users'

export interface Services {
	users: UsersService
	splits: SplitsService
	receipts: ReceiptsService
	paymentMethods: PaymentMethodsService
	contacts: ContactsService
}

export function createServices(
	auth: AuthClient,
	db: Database,
	cache: Cache,
	fns: FnsClient,
	catalog: CatalogClient,
	logger: Logger,
): Services {
	const repos = createRepositories(db, cache, logger)

	const users = new UsersService(repos.users, auth, logger.named('svc/users'))
	const calc = new CalculationService(logger.named('svc/calc'))
	const receipts = new ReceiptsService(repos.receipts, fns, catalog, logger.named('svc/receipts'))
	const splits = new SplitsService(
		repos.splits,
		repos.items,
		repos.itemGroups,
		repos.participants,
		repos.paymentMethods,
		repos.stats,
		repos.contacts,
		repos.receipts,
		calc,
		logger.named('svc/splits'),
	)
	const paymentMethods = new PaymentMethodsService(repos.paymentMethods, logger.named('svc/payment-methods'))
	const contacts = new ContactsService(repos.contacts, logger.named('svc/contacts'))

	return { users, splits, receipts, paymentMethods, contacts }
}
