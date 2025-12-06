import { SvelteDate } from 'svelte/reactivity'

import type { Platform } from '$lib/platform/types'
import { api } from '$lib/services/api/client'
import * as authApi from '$lib/services/auth/api'
import type { User } from '$lib/services/auth/types'
import { TypedStorage } from '$lib/services/storage/typed.svelte'
import { STORAGE_KEYS } from '$lib/shared/constants'
import { createLogger, logger } from '$lib/shared/logger'

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

export class App {
	private _state = $state<AppState>({
		status: 'initializing',
		user: null,
		consents: [],
		error: null
	})

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

	// expose log buffer for debug ui
	get debugLog() {
		return logger.getBuffer()
	}

	async init(platform: Platform): Promise<void> {
		this.platform = platform
		this.storage = new TypedStorage(platform.storage)

		api.setStorage(platform.storage)

		log.info(`initialized on ${platform.type} platform`)
		log.debug('platform ready', platform.ready)

		const isDev = import.meta.env.DEV
		const skipConsents = isDev && import.meta.env.VITE_DEV_USER_ID

		if (skipConsents) {
			log.info('dev mode: skipping consents')
			await this.authenticate()
			return
		}

		const consents = await this.loadConsents()
		const needsConsent = consents.some(c => c.required && !c.accepted)

		if (needsConsent) {
			log.info('consents required')
			this._state = {
				...this._state,
				status: 'consent_required',
				consents
			}
			return
		}

		log.info('consents accepted, starting auth')
		await this.authenticate()
	}

	async acceptConsent(type: 'terms' | 'privacy'): Promise<void> {
		const consents = this._state.consents.map(c =>
			c.type === type ? { ...c, accepted: true } : c
		)

		await this.storage?.set('consents', {
			terms: consents.find(c => c.type === 'terms')?.accepted ?? false,
			privacy: consents.find(c => c.type === 'privacy')?.accepted ?? false,
			acceptedAt: new SvelteDate().toISOString()
		})

		const allAccepted = consents.filter(c => c.required).every(c => c.accepted)

		if (allAccepted) {
			this._state = { ...this._state, consents, status: 'authenticating' }
			await this.authenticate()
		} else {
			this._state = { ...this._state, consents }
		}
	}

	async logout(): Promise<void> {
		log.info('logging out')
		await authApi.logout()
		this._state = {
			...this._state,
			status: 'unauthenticated',
			user: null
		}
	}

	setError(error: Error): void {
		log.error('fatal error', error.message)
		this._state = { ...this._state, status: 'error', error }
	}

	async setWebUser(): Promise<void> {
		log.info('web login callback received')
		await this.authenticate()
	}

	private async authenticate(): Promise<void> {
		if (!this.platform) {
			this.setError(new Error('platform not initialized'))
			return
		}

		this._state = { ...this._state, status: 'authenticating' }

		// step 1: try existing token
		const existingToken = await this.tryGetSavedToken()
		if (existingToken) {
			log.debug('found saved token, validating')
			const user = await this.validateTokenAndGetUser()
			if (user) {
				log.info(`authenticated via token: ${user.displayName}`)
				this._state = { ...this._state, status: 'ready', user }
				return
			}
			log.debug('token invalid or expired')
		}

		// step 2: try platform auth
		const payload = this.platform.getAuthPayload()

		if (!payload) {
			if (this.platform.type === 'telegram') {
				log.warn('telegram platform but no auth payload')
				const platformUser = this.platform.getUser()
				log.debug('platform user', platformUser)
			}
			this._state = { ...this._state, status: 'unauthenticated' }
			return
		}

		// step 3: authenticate with backend
		log.debug(`authenticating with backend (${payload.platform})`)
		try {
			const response = await authApi.authenticate(payload)
			log.info(`authenticated: ${response.user.displayName}`)
			this._state = { ...this._state, status: 'ready', user: response.user }
		} catch (error) {
			const message = error instanceof Error ? error.message : 'unknown error'
			log.error('authentication failed', message)
			this._state = { ...this._state, status: 'unauthenticated' }
		}
	}

	private async tryGetSavedToken(): Promise<string | null> {
		if (!this.platform) return null

		const result = await this.platform.storage.get(STORAGE_KEYS.AUTH_TOKEN)
		if (result.ok && result.value) {
			return result.value
		}
		return null
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
}

export const app = new App()
