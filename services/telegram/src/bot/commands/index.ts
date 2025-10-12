import { Composer } from 'grammy'

import { start } from '@/bot/commands/start'
import type { Context } from '@/bot/types'

export function registerCommands() {
	return new Composer<Context>().use(start())
}
