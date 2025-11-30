import type { Cache } from '@/platform/cache'
import type { Database } from '@/platform/database'
import type { Logger } from '@/platform/logger'

export abstract class BaseRepository {
	constructor(
		protected readonly db: Database,
		protected readonly cache: Cache,
		protected readonly logger: Logger,
	) {}

	protected async cached<T>(key: string, factory: () => Promise<T>, ttl: number = 600): Promise<T> {
		const cached = await this.cache.get<T>(key)
		if (cached !== null) {
			this.logger.debug('cache hit', { key })
			return cached
		}

		this.logger.debug('cache miss', { key })
		const value = await factory()
		await this.cache.set(key, value, ttl)
		return value
	}

	protected async invalidate(...keys: string[]): Promise<void> {
		await Promise.all(keys.map(k => this.cache.delete(k)))
	}

	protected async invalidatePattern(pattern: string): Promise<void> {
		await this.cache.deletePattern(pattern)
	}
}
