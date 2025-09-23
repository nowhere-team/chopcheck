import { drizzle } from 'drizzle-orm/bun-sql'

import type { Logger } from '@/platform/logger'

import { DatabaseLogger } from './logger'
import * as schema from './schema'

export interface DatabaseConfig {
	url: string
}

export async function createDatabase(logger: Logger, config: DatabaseConfig) {
	const db = drizzle({
		schema,
		connection: config.url,
		casing: 'snake_case',
		logger: new DatabaseLogger(logger.named('database')),
	})

	await db.$client.connect()

	return db
}

export { schema }
export type Database = Awaited<ReturnType<typeof createDatabase>>
