import { Bot as GrammyBot, type NextFunction } from 'grammy'

import { registerCommands } from '@/bot/commands'
import type { Logger } from '@/platform/logger'

import type { BotConfig, Context } from './types'

export function createBot(logger: Logger, config: BotConfig) {
	const bot = new GrammyBot<Context>(config.token, { client: { environment: config.dev ? 'test' : 'prod' } })
	const botLogger = logger.named('telegram')

	// inject dependencies
	bot.use(async (ctx: Context, next: NextFunction) => {
		ctx.config = config
		ctx.logger = botLogger
		await next()
	})

	bot.use(registerCommands())

	return {
		bot,
		stop: async () => bot.stop(),
		start: async () =>
			bot.start({
				drop_pending_updates: true,
				onStart: user => {
					botLogger.info('connected to telegram', { user })
				},
			}),
	}
}

export type Bot = ReturnType<typeof createBot>
