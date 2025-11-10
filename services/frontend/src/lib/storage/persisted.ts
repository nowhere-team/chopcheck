import { cloudStorage } from '@telegram-apps/sdk'

export interface PersistedStorage {
	get<T>(key: string): Promise<T | null>
	set<T>(key: string, value: T): Promise<void>
	remove(key: string): Promise<void>
	clear(): Promise<void>
}

class TelegramCloudStorage implements PersistedStorage {
	async get<T>(key: string): Promise<T | null> {
		try {
			const data = await cloudStorage.getItem(key)
			return data ? JSON.parse(data) : null
		} catch {
			return null
		}
	}

	async set<T>(key: string, value: T): Promise<void> {
		try {
			await cloudStorage.setItem(key, JSON.stringify(value))
		} catch (error) {
			console.error('telegram cloud storage error:', error)
		}
	}

	async remove(key: string): Promise<void> {
		try {
			await cloudStorage.deleteItem(key)
		} catch (error) {
			console.error('telegram cloud storage error:', error)
		}
	}

	async clear(): Promise<void> {
		try {
			const keys = await cloudStorage.getKeys()
			await Promise.all(keys.map(key => cloudStorage.deleteItem(key)))
		} catch (error) {
			console.error('telegram cloud storage error:', error)
		}
	}
}

class LocalStorage implements PersistedStorage {
	async get<T>(key: string): Promise<T | null> {
		try {
			const data = localStorage.getItem(key)
			return data ? JSON.parse(data) : null
		} catch {
			return null
		}
	}

	async set<T>(key: string, value: T): Promise<void> {
		try {
			localStorage.setItem(key, JSON.stringify(value))
		} catch (error) {
			console.error('localstorage error:', error)
		}
	}

	async remove(key: string): Promise<void> {
		try {
			localStorage.removeItem(key)
		} catch (error) {
			console.error('localstorage error:', error)
		}
	}

	async clear(): Promise<void> {
		try {
			localStorage.clear()
		} catch (error) {
			console.error('localstorage error:', error)
		}
	}
}

let instance: PersistedStorage | null = null

export function getPersistedStorage(): PersistedStorage {
	if (instance) return instance

	try {
		if (cloudStorage.isSupported()) {
			instance = new TelegramCloudStorage()
		} else {
			instance = new LocalStorage()
		}
	} catch {
		instance = new LocalStorage()
	}

	return instance
}
