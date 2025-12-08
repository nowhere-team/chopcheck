import { SvelteMap } from 'svelte/reactivity'

import { createLogger } from '$lib/shared/logger'

const log = createLogger('cache')

export interface CacheEntry<T> {
	data: T
	timestamp: number
	expiresAt: number
}

export interface CacheOptions {
	ttl?: number // time to live in ms
	staleWhileRevalidate?: boolean
}

const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

class ReactiveCache {
	private entries = $state<Map<string, CacheEntry<unknown>>>(new Map())
	private pending = new Map<string, Promise<unknown>>()

	get<T>(key: string): T | null {
		const entry = this.entries.get(key) as CacheEntry<T> | undefined
		if (!entry) return null

		const now = Date.now()
		if (now > entry.expiresAt) {
			log.debug(`cache expired: ${key}`)
			return null
		}

		return entry.data
	}

	set<T>(key: string, data: T, options: CacheOptions = {}): void {
		const ttl = options.ttl ?? DEFAULT_TTL
		const now = Date.now()

		const newEntries = new SvelteMap(this.entries)
		newEntries.set(key, {
			data,
			timestamp: now,
			expiresAt: now + ttl
		})
		this.entries = newEntries

		log.debug(`cache set: ${key}`, { ttl })
	}

	invalidate(key: string): void {
		if (this.entries.has(key)) {
			const newEntries = new SvelteMap(this.entries)
			newEntries.delete(key)
			this.entries = newEntries
			log.debug(`cache invalidated: ${key}`)
		}
	}

	invalidatePattern(pattern: string): void {
		const regex = new RegExp(pattern.replace(/\*/g, '.*'))
		const keysToDelete: string[] = []

		for (const key of this.entries.keys()) {
			if (regex.test(key)) {
				keysToDelete.push(key)
			}
		}

		if (keysToDelete.length > 0) {
			const newEntries = new SvelteMap(this.entries)
			keysToDelete.forEach(k => newEntries.delete(k))
			this.entries = newEntries
			log.debug(`cache invalidated pattern: ${pattern}`, { count: keysToDelete.length })
		}
	}

	clear(): void {
		this.entries = new Map()
		log.debug('cache cleared')
	}

	// deduplication for concurrent requests
	async dedupe<T>(key: string, factory: () => Promise<T>): Promise<T> {
		const existing = this.pending.get(key)
		if (existing) {
			log.debug(`dedupe hit: ${key}`)
			return existing as Promise<T>
		}

		const promise = factory().finally(() => {
			this.pending.delete(key)
		})

		this.pending.set(key, promise)
		return promise
	}

	// get or fetch with caching
	async getOrFetch<T>(
		key: string,
		fetcher: () => Promise<T>,
		options: CacheOptions = {}
	): Promise<T> {
		const cached = this.get<T>(key)
		if (cached !== null) {
			return cached
		}

		const data = await this.dedupe(key, fetcher)
		this.set(key, data, options)
		return data
	}
}

export const cache = new ReactiveCache()
