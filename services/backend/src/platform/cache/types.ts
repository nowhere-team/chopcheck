export interface CacheEntry<T = unknown> {
	value: T
	expiresAt?: number
}

export interface Cache {
	get<T>(key: string): Promise<T | null>
	set<T>(key: string, value: T, ttl?: number): Promise<void>
	delete(key: string): Promise<void>
	deletePattern(pattern: string): Promise<void>
	exists(key: string): Promise<boolean>

	// helpers
	getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>

	disconnect(): Promise<void>
}

export interface CacheConfig {
	url?: string
	keyPrefix?: string
	defaultTtl?: number
	maxMemoryItems?: number
}
