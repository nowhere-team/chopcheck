import type { Env } from 'bun'
import { z } from 'zod'

import { LOG_FORMATS, LOG_LEVELS } from '@/platform/logger'

const schema = z.object({
	NODE_ENV: z.enum(['development', 'production']).default('production'),
	APP_NAME: z.string().default('chopcheck-bot'),

	HTTP_PORT: z.coerce.number().min(1).max(65535).default(8081),

	LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
	LOG_FORMAT: z.enum(LOG_FORMATS).default('json'),

	TELEGRAM_BOT_TOKEN: z.string().nonempty(),
	TELEGRAM_WEB_APP_URL: z.string().nonempty(),
})

export function createConfig(env: Env) {
	return {
		...schema.parse(env),
		isDev() {
			return this.NODE_ENV !== 'production'
		},
		isProd() {
			return this.NODE_ENV === 'production'
		},
	}
}

export type Config = ReturnType<typeof createConfig>
