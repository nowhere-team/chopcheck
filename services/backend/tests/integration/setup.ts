import { migrate } from 'drizzle-orm/bun-sql/migrator'
import path from 'path'

import { type ApiSpec, createRouter } from '@/http'
import { createAuthClient } from '@/platform/auth'
import { createCache } from '@/platform/cache'
import { createDatabase, type Database } from '@/platform/database'
import { createLogger, type Logger } from '@/platform/logger'
import { createTracer } from '@/platform/tracing'
import { createServices } from '@/services'

import { createMockCatalogClient, createMockFnsClient, createMockTelegramClient } from './mocks'

export interface TestContext {
	app: ApiSpec
	db: Database
	logger: Logger
	cleanup: () => Promise<void>
}

let sharedContext: TestContext | null = null

export async function createTestContext(): Promise<TestContext> {
	if (sharedContext) {
		return sharedContext
	}

	const logger = createLogger({
		name: 'test',
		level: 'warn',
		format: 'text',
	})

	const databaseUrl = process.env.DATABASE_URL
	if (!databaseUrl) {
		throw new Error('DATABASE_URL must be set. run tests via: bun run test:integration')
	}

	logger.info('connecting to test database', { url: databaseUrl.replace(/:[^:@]+@/, ':***@') })

	const db = await createDatabase(logger, { url: databaseUrl })

	const migrationsPath = path.join(process.cwd(), 'migrations')
	await migrate(db, { migrationsFolder: migrationsPath })
	logger.info('migrations applied')

	const cache = await createCache(logger, {
		type: 'memory',
		keyPrefix: 'test',
		defaultTtl: 60,
		maxMemoryItems: 1000,
	})

	const tracer = createTracer({
		enabled: false,
		serviceName: 'test',
	})

	const auth = createAuthClient(logger, cache, {
		devMode: true,
		serviceTimeout: 5000,
		jwtSecret: 'test-secret-key-minimum-32-characters-long',
		jwtIssuer: 'nowhere-auth-service',
		jwtAudience: 'chopcheck',
	})

	const telegram = createMockTelegramClient()
	const fns = createMockFnsClient()
	const catalog = createMockCatalogClient()

	const services = createServices(auth, db, cache, fns, catalog, logger, {
		receipts: {
			maxImagesPerRequest: 3,
		},
	})

	const app = createRouter({
		database: db,
		auth,
		telegram,
		fns,
		catalog,
		services,
		config: {
			port: 0,
			telegramToken: 'test-token',
			webAppUrl: 'https://test.app',
			development: true,
		},
		logger,
		tracer,
	})

	const cleanup = async () => {
		await cache.disconnect()
		await db.$client.end()
		sharedContext = null
		logger.info('test context cleaned up')
	}

	sharedContext = { app, db, logger, cleanup }
	return sharedContext
}

export function getTestContext(): TestContext {
	if (!sharedContext) {
		throw new Error('Test context not initialized. Call createTestContext() in beforeAll()')
	}
	return sharedContext
}

export async function resetTestData(ctx: TestContext): Promise<void> {
	await ctx.db.execute(`
		TRUNCATE TABLE
			split_audit_log,
			split_payments,
			split_payment_methods,
			split_item_participants,
			split_items,
			split_participants,
			split_receipts,
			splits,
			receipt_items,
			receipts,
			user_payment_methods,
			users
		CASCADE
	`)
}
