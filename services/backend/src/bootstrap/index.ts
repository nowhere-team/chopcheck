import { createServer } from '@/http'
import { createAuthClient } from '@/platform/auth'
import { createCache } from '@/platform/cache'
import { createCatalogClient } from '@/platform/catalog'
import { createConfig } from '@/platform/config'
import { createDatabase } from '@/platform/database'
import { createFnsClient } from '@/platform/fns'
import { createLogger } from '@/platform/logger'
import { createTelegramClient } from '@/platform/telegram'
import { createTracer } from '@/platform/tracing'
import { createServices } from '@/services'

export async function start() {
	const config = createConfig(process.env)
	const logger = createLogger({ format: config.LOG_FORMAT, level: config.LOG_LEVEL })
	logger.info('starting application', { env: config.NODE_ENV })

	const tracer = createTracer({
		enabled: config.TRACING_ENABLED,
		serviceName: config.SERVICE_NAME,
		exporterType: config.TRACING_EXPORTER,
		exporterUrl: config.TRACING_ENDPOINT,
	})
	logger.info('tracer initialized', { enabled: tracer.enabled })

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

	const telegram = createTelegramClient(logger, config.TELEGRAM_SERVICE_URL)
	logger.info('telegram client initialized')

	const fns = createFnsClient(
		{
			apiUrl: config.FNS_API_URL,
			tokens: config.fnsTokens,
			rotationMinutes: config.FNS_TOKEN_ROTATION_MINUTES,
			requestTimeout: config.FNS_REQUEST_TIMEOUT,
		},
		logger,
		tracer,
	)
	logger.info('fns client initialized', { tokenCount: config.fnsTokens.length })

	const catalog = createCatalogClient(
		{ serviceUrl: config.CATALOG_SERVICE_URL, requestTimeout: config.CATALOG_REQUEST_TIMEOUT },
		logger,
		tracer,
	)
	logger.info('catalog client initialized')

	const services = createServices(auth, database, cache, fns, catalog, logger)
	logger.info('services initialized')

	const serverConfig = {
		port: config.PORT,
		telegramToken: config.TELEGRAM_BOT_TOKEN,
		webAppUrl: config.TELEGRAM_WEB_APP_URL,
		development: config.isDev(),
	}
	const server = createServer(
		{
			database,
			auth,
			telegram,
			fns,
			catalog,
			services,
			config: serverConfig,
			logger: logger.named('http'),
			tracer,
		},
		serverConfig,
	)
	logger.info('http server started', { port: config.PORT })

	logger.info('application is ready')

	return { config, logger, tracer, database, cache, auth, fns, catalog, services, server, telegram }
}

export async function stop(app: Awaited<ReturnType<typeof start>>) {
	app.logger.info('shutting down')
	await app.server.instance.stop()
	await app.tracer.shutdown()
	await app.database.$client.end()
	await app.cache.disconnect()
	app.logger.info('application stopped')
}
