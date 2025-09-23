import { RedisClient } from 'bun'

import type { Logger } from '@/platform/logger'

import type { Cache, CacheConfig } from './types'

export class RedisCache implements Cache {
	private redis?: RedisClient

	constructor(
		private readonly config: CacheConfig,
		private readonly logger: Logger,
	) {
		this.logger = logger.named('cache/redis')
	}

	async connect(): Promise<void> {
		if (this.redis) return
		this.redis = new RedisClient(this.config.url)

		await Promise.race([
			this.redis.connect(),
			new Promise((_, reject) => setTimeout(() => reject(new Error('redis connection timeout')), 2000)),
		])
	}

	private ensureConnected(): RedisClient {
		if (!this.redis) {
			throw new Error('redis client not connected - call connect() first')
		}
		return this.redis
	}

	private prefixKey(key: string): string {
		return this.config.keyPrefix ? `${this.config.keyPrefix}:${key}` : key
	}

	async get<T>(key: string): Promise<T | null> {
		try {
			const client = this.ensureConnected()
			const result = await client.get(this.prefixKey(key))
			return result ? JSON.parse(result) : null
		} catch (error) {
			this.logger.warn('redis get failed', { key, error })
			return null
		}
	}

	async set<T>(key: string, value: T, ttl?: number): Promise<void> {
		try {
			const client = this.ensureConnected()
			const prefixedKey = this.prefixKey(key)
			const serialized = JSON.stringify(value)
			const actualTtl = ttl ?? this.config.defaultTtl

			await client.set(prefixedKey, serialized)

			if (actualTtl) {
				await client.expire(prefixedKey, actualTtl)
			}
		} catch (error) {
			this.logger.warn('redis set failed', { key, error })
		}
	}

	async delete(key: string): Promise<void> {
		try {
			const client = this.ensureConnected()
			await client.del(this.prefixKey(key))
		} catch (error) {
			this.logger.warn('redis delete failed', { key, error })
		}
	}

	async deletePattern(pattern: string): Promise<void> {
		try {
			const client = this.ensureConnected()
			const prefixedPattern = this.prefixKey(pattern)
			const keys = await client.keys(prefixedPattern)
			if (keys.length > 0) {
				await client.del(...keys)
			}
		} catch (error) {
			this.logger.warn('redis delete pattern failed', { pattern, error })
		}
	}

	async exists(key: string): Promise<boolean> {
		try {
			const client = this.ensureConnected()
			return await client.exists(this.prefixKey(key))
		} catch (error) {
			this.logger.warn('redis exists failed', { key, error })
			return false
		}
	}

	async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
		const cached = await this.get<T>(key)
		if (cached !== null) return cached

		const value = await factory()
		await this.set(key, value, ttl)
		return value
	}

	async disconnect(): Promise<void> {
		if (this.redis) {
			this.redis.close()
			this.redis = undefined
		}
	}
}
