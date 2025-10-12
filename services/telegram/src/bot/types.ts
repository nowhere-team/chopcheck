import { Context as GrammyContext } from 'grammy'

import type { Logger } from '@/platform/logger'

export interface BotConfig {
	token: string
	webAppUrl: string
	dev?: boolean
}

export interface Context extends GrammyContext {
	logger: Logger
	config: BotConfig
}
