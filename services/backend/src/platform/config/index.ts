import type { Env } from 'bun'
import { z } from 'zod'

import { LOG_FORMATS, LOG_LEVELS } from '@/platform/logger'

const schema = z.object({
	NODE_ENV: z.enum(['development', 'production']).default('production'),
	APP_NAME: z.string().default('chopcheck'),

	LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
	LOG_FORMAT: z.enum(LOG_FORMATS).default('json'),

	DATABASE_URL: z.url().nonempty(),

	CACHE_TYPE: z.enum(['redis', 'memory']).default('memory'),
	CACHE_URL: z.string().optional(),
	CACHE_KEY_PREFIX: z.string().default('cc'),
	CACHE_DEFAULT_TTL: z.coerce.number().default(3600), // 1 hour
	CACHE_MAX_MEMORY_ITEMS: z.coerce.number().default(1000),

	PORT: z.coerce.number().min(1).max(65535).default(8080),
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
