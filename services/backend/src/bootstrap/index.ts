import { createServer, type Server } from '@/http'
import { type Cache, createCache } from '@/platform/cache'
import { type Config, createConfig } from '@/platform/config'
import { createDatabase, type Database } from '@/platform/database'
import { createLogger, type Logger } from '@/platform/logger'

export interface App {
	config: Config
	logger: Logger
	database: Database
	cache: Cache
	server: Server
}

export async function start(): Promise<App> {
	const config = createConfig(process.env)
	const logger = createLogger({ format: config.LOG_FORMAT, level: config.LOG_LEVEL })
	logger.info('starting application', { env: config.NODE_ENV })

	const database = await createDatabase(logger, { url: config.DATABASE_URL })
	logger.info('database initialized')

	const cache = await createCache(logger, {
		type: config.CACHE_TYPE,
		url: config.CACHE_URL,
		keyPrefix: config.CACHE_KEY_PREFIX,
		defaultTtl: config.CACHE_DEFAULT_TTL,
		maxMemoryItems: config.CACHE_MAX_MEMORY_ITEMS,
	})
	logger.info('cache initialized')

	const server = createServer(logger, { port: config.PORT, development: config.isDev() })
	logger.info('http server started', { port: config.PORT })

	logger.info('application is ready')

	return { config, logger, database, cache, server }
}

export async function stop(app: App) {
	app.logger.info('shutting down application')

	await app.server.instance.stop()

	await app.database.$client.end()

	app.logger.info('application stopped')
}
