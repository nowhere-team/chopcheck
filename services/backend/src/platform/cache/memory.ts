import type { Logger } from '@/platform/logger'

import type { Cache, CacheConfig, CacheEntry } from './types'

export class MemoryCache implements Cache {
	private store = new Map<string, CacheEntry>()
	private cleanupTimer?: Timer

	constructor(
		private config: CacheConfig,
		private readonly logger: Logger,
	) {
		this.logger = logger.named('cache/memory')
		this.startCleanup()
	}

	private startCleanup(): void {
		// cleanup expired entries every minute
		this.cleanupTimer = setInterval(() => {
			this.cleanup()
		}, 60_000)
	}

	private cleanup(): void {
		const now = Date.now()
		let removed = 0

		for (const [key, entry] of this.store.entries()) {
			if (entry.expiresAt && entry.expiresAt < now) {
				this.store.delete(key)
				removed++
			}
		}

		if (removed > 0) {
			this.logger.debug('cleanup expired entries', { removed, remaining: this.store.size })
		}
	}

	private isExpired(entry: CacheEntry): boolean {
		return entry.expiresAt ? entry.expiresAt < Date.now() : false
	}

	private prefixKey(key: string): string {
		return this.config.keyPrefix ? `${this.config.keyPrefix}:${key}` : key
	}

	async get<T>(key: string): Promise<T | null> {
		const prefixedKey = this.prefixKey(key)

		const entry = this.store.get(key)
		if (!entry) return null
		if (this.isExpired(entry)) {
			this.store.delete(prefixedKey)
			return null
		}

		return entry.value as T
	}

	async set<T>(key: string, value: T, ttl?: number): Promise<void> {
		const prefixedKey = this.prefixKey(key)
		const actualTtl = ttl ?? this.config.defaultTtl

		const entry: CacheEntry<T> = {
			value,
			expiresAt: actualTtl ? Date.now() + actualTtl * 1000 : undefined,
		}

		this.store.set(prefixedKey, entry)

		// enforce max items limit
		if (this.config.maxMemoryItems && this.store.size > this.config.maxMemoryItems) {
			const oldestKey = this.store.keys().next().value
			if (oldestKey) this.store.delete(oldestKey)
		}
	}

	async delete(key: string): Promise<void> {
		this.store.delete(this.prefixKey(key))
	}

	async deletePattern(pattern: string): Promise<void> {
		const regex = new RegExp(pattern.replace('*', '.*'))
		const keysToDelete: string[] = []

		for (const key of this.store.keys()) {
			if (regex.test(key)) keysToDelete.push(key)
		}

		keysToDelete.forEach(key => this.store.delete(key))
	}

	async exists(key: string): Promise<boolean> {
		return this.store.has(this.prefixKey(key))
	}

	async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
		const cached = await this.get<T>(key)
		if (cached !== null) return cached

		const value = await factory()
		await this.set(key, value, ttl)
		return value
	}

	async disconnect(): Promise<void> {
		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer)
		}
		this.store.clear()
	}
}
