import { SvelteMap } from 'svelte/reactivity'

import { createLogger } from '$lib/shared/logger'

const log = createLogger('cache')

export interface CacheEntry<T> {
	data: T
	timestamp: number
	expiresAt: number
}

export interface CacheOptions {
	ttl?: number
	staleWhileRevalidate?: boolean
}

// sentinel value to distinguish "not in cache" from "cached null"
const NOT_FOUND = Symbol('cache-not-found')

const DEFAULT_TTL = 5 * 60 * 1000

class ReactiveCache {
	private entries = $state<Map<string, CacheEntry<unknown>>>(new Map())
	private pending = new Map<string, Promise<unknown>>()

	// returns NOT_FOUND symbol if key doesn't exist or expired
	// returns actual data (including null) if cached
	getWithStatus<T>(key: string): T | typeof NOT_FOUND {
		const entry = this.entries.get(key) as CacheEntry<T> | undefined
		if (!entry) return NOT_FOUND

		const now = Date.now()
		if (now > entry.expiresAt) {
			log.debug(`cache expired: ${key}`)
			return NOT_FOUND
		}

		return entry.data
	}

	// legacy method for backward compat - but be careful with null values!
	get<T>(key: string): T | null {
		const result = this.getWithStatus<T>(key)
		if (result === NOT_FOUND) return null
		return result as T
	}

	has(key: string): boolean {
		const result = this.getWithStatus(key)
		return result !== NOT_FOUND
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
			keysToDelete.push(key)
		}

		const toDelete = keysToDelete.filter(k => regex.test(k))

		if (toDelete.length > 0) {
			const newEntries = new SvelteMap(this.entries)
			toDelete.forEach(k => newEntries.delete(k))
			this.entries = newEntries
			log.debug(`cache invalidated pattern: ${pattern}`, { count: toDelete.length })
		}
	}

	clear(): void {
		this.entries = new Map()
		log.debug('cache cleared')
	}

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

	async getOrFetch<T>(
		key: string,
		fetcher: () => Promise<T>,
		options: CacheOptions = {}
	): Promise<T> {
		const cached = this.getWithStatus<T>(key)
		if (cached !== NOT_FOUND) {
			return cached as T
		}

		const data = await this.dedupe(key, fetcher)
		this.set(key, data, options)
		return data
	}
}

export const cache = new ReactiveCache()

// export for use in query.svelte.ts
export const CACHE_NOT_FOUND = NOT_FOUND
