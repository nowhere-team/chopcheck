import type { Cache } from '@/platform/cache'
import type { Database } from '@/platform/database'
import type { Logger } from '@/platform/logger'

import { ItemsRepository } from './items'
import { ParticipantsRepository } from './participants'
import { SplitsRepository } from './splits'
import { UsersRepository } from './users'
import { PaymentMethodsRepository } from './payment-methods'

export interface Repositories {
	splits: SplitsRepository
	items: ItemsRepository
	participants: ParticipantsRepository
	users: UsersRepository
	paymentMethods: PaymentMethodsRepository
}

export function createRepositories(db: Database, cache: Cache, logger: Logger): Repositories {
	const splits = new SplitsRepository(db, cache, logger.named('repository/splits'))
	const items = new ItemsRepository(db, cache, logger.named('repository/items'))
	const participants = new ParticipantsRepository(db, cache, logger.named('repository/participants'))
	const users = new UsersRepository(db, cache, logger.named('repository/users'))
	const paymentMethods = new PaymentMethodsRepository(db, cache, logger.named('repository/payment-methods'))
	return { splits, items, participants, users, paymentMethods}
}
