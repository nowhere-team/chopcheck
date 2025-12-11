import type { PlatformStorage } from '$lib/platform/types'
import { createLogger } from '$lib/shared/logger'

import { STORAGE_SCHEMAS, type StorageKey, type StorageValue } from './schema'

const log = createLogger('typed-storage')

export class TypedStorage {
	private cache: Partial<Record<StorageKey, unknown>> = $state({})

	constructor(private storage: PlatformStorage) {}

	async get<K extends StorageKey>(key: K): Promise<StorageValue<K> | null> {
		if (key in this.cache) {
			return this.cache[key] as StorageValue<K>
		}

		const result = await this.storage.get(key)
		if (!result.ok || !result.value) {
			return null
		}

		try {
			const parsed = JSON.parse(result.value)
			const schema = STORAGE_SCHEMAS[key]
			const validated = schema.parse(parsed)
			this.cache[key] = validated
			return validated as StorageValue<K>
		} catch (error) {
			log.warn(`validation failed for "${key}"`, error)
			return null
		}
	}

	async set<K extends StorageKey>(key: K, value: StorageValue<K>): Promise<void> {
		const schema = STORAGE_SCHEMAS[key]
		const validated = schema.parse(value)

		const result = await this.storage.set(key, JSON.stringify(validated))
		if (!result.ok) {
			throw result.error
		}

		this.cache[key] = validated
		log.debug(`saved "${key}"`)
	}

	async remove(key: StorageKey): Promise<void> {
		const result = await this.storage.remove(key)
		if (!result.ok) {
			throw result.error
		}
		delete this.cache[key]
		log.debug(`removed "${key}"`)
	}

	getCached<K extends StorageKey>(key: K): StorageValue<K> | null {
		return (this.cache[key] as StorageValue<K>) ?? null
	}
}
