import { type Bot, createBot } from '@/bot'
import { type Config, createConfig } from '@/platform/config'
import { createLogger, type Logger } from '@/platform/logger'

export interface App {
	config: Config
	logger: Logger
	bot: Bot
}

export async function start(): Promise<App> {
	const config = createConfig(process.env)
	const logger = createLogger({ format: config.LOG_FORMAT, level: config.LOG_LEVEL })
	logger.info('starting application', { env: config.NODE_ENV })

	const bot = createBot(logger, {
		token: config.TELEGRAM_BOT_TOKEN,
		webAppUrl: config.TELEGRAM_WEB_APP_URL,
		dev: config.isDev(),
	})
	bot.start().then()

	return { config, logger, bot }
}

export async function stop(app: App): Promise<void> {
	app.logger.info('shutting down application')

	await app.bot.stop()

	app.logger.info('application stopped')
}
