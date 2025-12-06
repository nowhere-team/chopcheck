import { SvelteDate } from 'svelte/reactivity'

import type { Platform } from '$lib/platform/types'
import { api } from '$lib/services/api/client'
import * as authApi from '$lib/services/auth/api'
import type { User } from '$lib/services/auth/types'
import { TypedStorage } from '$lib/services/storage/typed.svelte'
import { STORAGE_KEYS } from '$lib/shared/constants'
import { createLogger, type LogEntry, logger } from '$lib/shared/logger'

const log = createLogger('app')

export type AppStatus =
	| 'initializing'
	| 'consent_required'
	| 'unauthenticated'
	| 'authenticating'
	| 'ready'
	| 'error'

export interface Consent {
	type: 'terms' | 'privacy'
	required: boolean
	accepted: boolean
}

export interface AppState {
	status: AppStatus
	user: User | null
	consents: Consent[]
	error: Error | null
}

function createInitialState(): AppState {
	return {
		status: 'initializing',
		user: null,
		consents: [],
		error: null
	}
}

export class App {
	private _state = $state<AppState>(createInitialState())
	private platform: Platform | null = null
	private storage: TypedStorage | null = null

	get state(): AppState {
		return this._state
	}

	get isReady(): boolean {
		return this._state.status === 'ready'
	}

	get user(): User | null {
		return this._state.user
	}

	get debugLog(): LogEntry[] {
		return logger.getBuffer()
	}

	async init(platform: Platform): Promise<void> {
		this.platform = platform
		this.storage = new TypedStorage(platform.storage)
		api.setStorage(platform.storage)

		log.info('initialized', { platform: platform.type })

		const skipConsents = import.meta.env.DEV && import.meta.env.VITE_DEV_USER_ID
		if (skipConsents) {
			log.info('dev mode: skipping consents')
			await this.authenticate()
			return
		}

		const consents = await this.loadConsents()
		const needsConsent = consents.some(c => c.required && !c.accepted)

		if (needsConsent) {
			this.updateState({ status: 'consent_required', consents })
			return
		}

		await this.authenticate()
	}

	async acceptConsent(type: 'terms' | 'privacy'): Promise<void> {
		const consents = this._state.consents.map(c =>
			c.type === type ? { ...c, accepted: true } : c
		)

		await this.saveConsents(consents)

		const allAccepted = consents.filter(c => c.required).every(c => c.accepted)
		if (allAccepted) {
			this.updateState({ consents, status: 'authenticating' })
			await this.authenticate()
		} else {
			this.updateState({ consents })
		}
	}

	async logout(): Promise<void> {
		log.info('logging out')
		await authApi.logout()
		this.updateState({ status: 'unauthenticated', user: null })
	}

	setError(error: Error): void {
		log.error('fatal error', error.message)
		this.updateState({ status: 'error', error })
	}

	async setWebUser(): Promise<void> {
		log.info('web login callback received')
		await this.authenticate()
	}

	private updateState(partial: Partial<AppState>): void {
		this._state = { ...this._state, ...partial }
	}

	private async authenticate(): Promise<void> {
		if (!this.platform) {
			this.setError(new Error('platform not initialized'))
			return
		}

		this.updateState({ status: 'authenticating' })

		const existingToken = await this.tryGetSavedToken()
		if (existingToken) {
			const user = await this.validateTokenAndGetUser()
			if (user) {
				log.info('authenticated via token', { user: user.displayName })
				this.updateState({ status: 'ready', user })
				return
			}
		}

		const payload = this.platform.getAuthPayload()
		if (!payload) {
			log.debug('no auth payload available')
			this.updateState({ status: 'unauthenticated' })
			return
		}

		try {
			const response = await authApi.authenticate(payload)
			log.info('authenticated', { user: response.user.displayName })
			this.updateState({ status: 'ready', user: response.user })
		} catch (error) {
			log.error('authentication failed', error)
			this.updateState({ status: 'unauthenticated' })
		}
	}

	private async tryGetSavedToken(): Promise<string | null> {
		if (!this.platform) return null
		const result = await this.platform.storage.get(STORAGE_KEYS.AUTH_TOKEN)
		return result.ok ? result.value : null
	}

	private async validateTokenAndGetUser(): Promise<User | null> {
		try {
			return await authApi.getMe()
		} catch {
			await api.clearToken()
			return null
		}
	}

	private async loadConsents(): Promise<Consent[]> {
		const saved = await this.storage?.get('consents')
		return [
			{ type: 'terms', required: true, accepted: saved?.terms ?? false },
			{ type: 'privacy', required: true, accepted: saved?.privacy ?? false }
		]
	}

	private async saveConsents(consents: Consent[]): Promise<void> {
		await this.storage?.set('consents', {
			terms: consents.find(c => c.type === 'terms')?.accepted ?? false,
			privacy: consents.find(c => c.type === 'privacy')?.accepted ?? false,
			acceptedAt: new SvelteDate().toISOString()
		})
	}
}

export const app = new App()
