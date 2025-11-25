import { createServer, type Server } from '@/http'
import { AuthClient, createAuthClient } from '@/platform/auth'
import { type Cache, createCache } from '@/platform/cache'
import { type Config, createConfig } from '@/platform/config'
import { createDatabase, type Database } from '@/platform/database'
import { createLogger, type Logger } from '@/platform/logger'
import { createServices, type Services } from '@/services'

export interface App {
	config: Config
	logger: Logger
	database: Database
	cache: Cache
	auth: AuthClient
	services: Services
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

	const auth = createAuthClient(logger, cache, {
		serviceUrl: config.AUTH_SERVICE_URL,
		serviceTimeout: config.AUTH_SERVICE_TIMEOUT,
		devMode: config.AUTH_DEV_MODE,
		jwtSecret: config.JWT_SECRET,
		jwtIssuer: config.JWT_ISSUER,
		jwtAudience: config.JWT_AUDIENCE,
	})
	logger.info('auth client initialized', { devMode: config.AUTH_DEV_MODE })

	const services = createServices(auth, database, cache, logger)
	logger.info('services initialized')

	const serverConfig = { port: config.PORT, telegramToken: config.TELEGRAM_BOT_TOKEN, development: config.isDev() }
	const server = createServer(logger, database, auth, services, cache, serverConfig)
	logger.info('http server started', { port: config.PORT })

	logger.info('application is ready')

	return { config, logger, database, cache, auth, services, server }
}

export async function stop(app: App) {
	app.logger.info('shutting down application')

	await app.server.instance.stop()

	await app.database.$client.end()

	app.logger.info('application stopped')
}
