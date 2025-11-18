import { type Bot, createBot } from '@/bot'
import { createHttpServer } from '@/http'
import { type Config, createConfig } from '@/platform/config'
import { createLogger, type Logger } from '@/platform/logger'

export interface App {
	config: Config
	logger: Logger
	bot: Bot
	httpServer: Bun.Server
}

export async function start(): Promise<App> {
	const config = createConfig(process.env)
	const logger = createLogger({ format: config.LOG_FORMAT, level: config.LOG_LEVEL })
	logger.info('starting telegram service', { env: config.NODE_ENV })

	const bot = await createBot(logger, {
		token: config.TELEGRAM_BOT_TOKEN,
		webAppUrl: config.TELEGRAM_WEB_APP_URL,
		dev: config.isDev(),
	})

	logger.info('bot initialized')

	bot.start().then()

	const httpServer = createHttpServer(bot, logger, config.HTTP_PORT, bot.username)

	return { config, logger, bot, httpServer }
}

export async function stop(app: App): Promise<void> {
	app.logger.info('shutting down telegram service')
	await app.bot.stop()
	await app.httpServer.stop()
	app.logger.info('telegram service stopped')
}
