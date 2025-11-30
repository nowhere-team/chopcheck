import type { Cache } from '@/platform/cache'
import type { Database } from '@/platform/database'
import type { Logger } from '@/platform/logger'

import { ContactsRepository } from './contacts'
import { ItemsRepository } from './items'
import { ParticipantsRepository } from './participants'
import { PaymentMethodsRepository } from './payment-methods'
import { SplitsRepository } from './splits'
import { StatsRepository } from './stats'
import { UsersRepository } from './users'

export interface Repositories {
	splits: SplitsRepository
	items: ItemsRepository
	participants: ParticipantsRepository
	paymentMethods: PaymentMethodsRepository
	users: UsersRepository
	stats: StatsRepository
	contacts: ContactsRepository
}

export function createRepositories(db: Database, cache: Cache, logger: Logger): Repositories {
	const splits = new SplitsRepository(db, cache, logger.named('repository/splits'))
	const items = new ItemsRepository(db, cache, logger.named('repository/items'))
	const participants = new ParticipantsRepository(db, cache, logger.named('repository/participants'))
	const users = new UsersRepository(db, cache, logger.named('repository/users'))
	const stats = new StatsRepository(db, cache, logger.named('repository/stats'))
	const paymentMethods = new PaymentMethodsRepository(db, cache, logger.named('repository/payment-methods'))
	const contacts = new ContactsRepository(db, cache, logger.named('repository/contacts'))
	return { splits, items, participants, paymentMethods, users, stats, contacts }
}
