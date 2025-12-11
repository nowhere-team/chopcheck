import { type AsyncResult, err, ok } from '$lib/shared/types'

import type { PlatformStorage } from '../types'

export class WebStorage implements PlatformStorage {
	private readonly available: boolean

	constructor() {
		this.available = typeof window !== 'undefined' && this.checkAvailability()
	}

	private checkAvailability(): boolean {
		try {
			const test = '__storage_test__'
			localStorage.setItem(test, test)
			localStorage.removeItem(test)
			return true
		} catch {
			return false
		}
	}

	async get(key: string): AsyncResult<string | null> {
		if (!this.available) {
			return err(new Error('localStorage not available'))
		}
		try {
			return ok(localStorage.getItem(key))
		} catch (e) {
			return err(e instanceof Error ? e : new Error('storage read failed'))
		}
	}

	async set(key: string, value: string): AsyncResult<void> {
		if (!this.available) {
			return err(new Error('localStorage not available'))
		}
		try {
			localStorage.setItem(key, value)
			return ok(undefined)
		} catch (e) {
			return err(e instanceof Error ? e : new Error('storage write failed'))
		}
	}

	async remove(key: string): AsyncResult<void> {
		if (!this.available) {
			return err(new Error('localStorage not available'))
		}
		try {
			localStorage.removeItem(key)
			return ok(undefined)
		} catch (e) {
			return err(e instanceof Error ? e : new Error('storage remove failed'))
		}
	}

	async clear(): AsyncResult<void> {
		if (!this.available) {
			return err(new Error('localStorage not available'))
		}
		try {
			localStorage.clear()
			return ok(undefined)
		} catch (e) {
			return err(e instanceof Error ? e : new Error('storage clear failed'))
		}
	}
}
