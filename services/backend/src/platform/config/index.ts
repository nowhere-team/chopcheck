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
	CACHE_DEFAULT_TTL: z.coerce.number().default(3600),
	CACHE_MAX_MEMORY_ITEMS: z.coerce.number().default(1000),

	AUTH_SERVICE_URL: z.url().optional(),
	AUTH_SERVICE_TIMEOUT: z.coerce.number().default(5000),
	AUTH_DEV_MODE: z.coerce.boolean().default(false),

	JWT_SECRET: z.string().min(32, 'jwt secret must be at least 32 characters'),
	JWT_ISSUER: z.string().default('nowhere-auth-service'),
	JWT_AUDIENCE: z.string().default('chopcheck'),

	TELEGRAM_BOT_TOKEN: z.string().nonempty(),
	TELEGRAM_SERVICE_URL: z.url().nonempty(),
	TELEGRAM_WEB_APP_URL: z.url().nonempty(),

	// fns integration
	FNS_API_URL: z.url().default('https://proverkacheka.com/api/v1'),
	FNS_TOKENS: z.string().nonempty().describe('comma-separated list of fns api tokens'),
	FNS_TOKEN_ROTATION_MINUTES: z.coerce.number().default(10),
	FNS_REQUEST_TIMEOUT: z.coerce.number().default(15000),

	// catalog integration
	CATALOG_SERVICE_URL: z.url().nonempty(),
	CATALOG_REQUEST_TIMEOUT: z.coerce.number().default(30000),
	CATALOG_MAX_IMAGES: z.coerce.number().min(1).max(10).default(5),

	// tracing
	TRACING_ENABLED: z
		.enum(['true', 'false'])
		.default('false')
		.transform(val => val === 'true'),
	TRACING_EXPORTER: z.enum(['otlp', 'console', 'none']).default('none'),
	TRACING_ENDPOINT: z.string().optional(),
	SERVICE_NAME: z.string().default('chopcheck'),

	PORT: z.coerce.number().min(1).max(65535).default(8080),
})

export function createConfig(env: Env) {
	const parsed = schema.parse(env)
	return {
		...parsed,
		fnsTokens: parsed.FNS_TOKENS.split(',')
			.map(t => t.trim())
			.filter(Boolean),
		isDev() {
			return this.NODE_ENV !== 'production'
		},
		isProd() {
			return this.NODE_ENV === 'production'
		},
	}
}

export type Config = ReturnType<typeof createConfig>
