import { type AsyncResult, err, ok } from '$lib/shared/types'

import type { PlatformStorage } from '../types'

export class TelegramCloudStorage implements PlatformStorage {
	private cloudStorage: typeof import('@telegram-apps/sdk').cloudStorage | null = null

	async init(): Promise<boolean> {
		try {
			const sdk = await import('@telegram-apps/sdk')
			if (sdk.cloudStorage.isSupported()) {
				this.cloudStorage = sdk.cloudStorage
				return true
			}
			return false
		} catch {
			return false
		}
	}

	async get(key: string): AsyncResult<string | null> {
		if (!this.cloudStorage) {
			return err(new Error('cloud storage not initialized'))
		}
		try {
			const value = await this.cloudStorage.getItem(key)
			return ok(value === '' ? null : value)
		} catch (e) {
			return err(e instanceof Error ? e : new Error('cloud storage read failed'))
		}
	}

	async set(key: string, value: string): AsyncResult<void> {
		if (!this.cloudStorage) {
			return err(new Error('cloud storage not initialized'))
		}
		try {
			await this.cloudStorage.setItem(key, value)
			return ok(undefined)
		} catch (e) {
			return err(e instanceof Error ? e : new Error('cloud storage write failed'))
		}
	}

	async remove(key: string): AsyncResult<void> {
		if (!this.cloudStorage) {
			return err(new Error('cloud storage not initialized'))
		}
		try {
			await this.cloudStorage.deleteItem(key)
			return ok(undefined)
		} catch (e) {
			return err(e instanceof Error ? e : new Error('cloud storage remove failed'))
		}
	}

	async clear(): AsyncResult<void> {
		if (!this.cloudStorage) {
			return err(new Error('cloud storage not initialized'))
		}
		try {
			const keys = await this.cloudStorage.getKeys()
			await Promise.all(keys.map(k => this.cloudStorage!.deleteItem(k)))
			return ok(undefined)
		} catch (e) {
			return err(e instanceof Error ? e : new Error('cloud storage clear failed'))
		}
	}
}
