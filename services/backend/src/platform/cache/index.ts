import type { Logger } from '@/platform/logger'

import { MemoryCache } from './memory'
import { RedisCache } from './redis'
import type { Cache, CacheConfig } from './types'

export interface CacheFactoryConfig extends CacheConfig {
	type: 'redis' | 'memory'
}

export async function createCache(logger: Logger, config: CacheFactoryConfig): Promise<Cache> {
	const cacheLogger = logger.named('cache')

	if (config.type === 'redis') {
		const redisCache = new RedisCache(config, cacheLogger)
		await redisCache.connect()
		cacheLogger.info('connected to redis cache')

		return redisCache
	}

	cacheLogger.info('using in-memory cache')
	return new MemoryCache(config, cacheLogger)
}

export * from './memory'
export * from './redis'
export * from './types'
