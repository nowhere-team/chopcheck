import type { Cache } from '@/platform/cache'
import type { Database } from '@/platform/database'
import type { Logger } from '@/platform/logger'

import { ContactsRepository } from './contacts'
import { ItemsRepository } from './items'
import { ParticipantsRepository } from './participants'
import { PaymentMethodsRepository } from './payment-methods'
import { ReceiptsRepository } from './receipts'
import { SplitsRepository } from './splits'
import { StatsRepository } from './stats'
import { UsersRepository } from './users'

export interface Repositories {
	users: UsersRepository
	splits: SplitsRepository
	items: ItemsRepository
	participants: ParticipantsRepository
	receipts: ReceiptsRepository
	paymentMethods: PaymentMethodsRepository
	contacts: ContactsRepository
	stats: StatsRepository
}

export function createRepositories(db: Database, cache: Cache, logger: Logger): Repositories {
	return {
		users: new UsersRepository(db, cache, logger.named('repo/users')),
		splits: new SplitsRepository(db, cache, logger.named('repo/splits')),
		items: new ItemsRepository(db, cache, logger.named('repo/items')),
		participants: new ParticipantsRepository(db, cache, logger.named('repo/participants')),
		receipts: new ReceiptsRepository(db, cache, logger.named('repo/receipts')),
		paymentMethods: new PaymentMethodsRepository(db, cache, logger.named('repo/payment-methods')),
		contacts: new ContactsRepository(db, cache, logger.named('repo/contacts')),
		stats: new StatsRepository(db, cache, logger.named('repo/stats')),
	}
}

export * from './contacts'
export * from './items'
export * from './participants'
export * from './payment-methods'
export * from './receipts'
export * from './splits'
export * from './stats'
export * from './users'
