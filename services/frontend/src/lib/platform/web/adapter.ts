import { createLogger } from '$lib/shared/logger'
import { type AsyncResult, ok } from '$lib/shared/types'

import { applySafeArea, applyThemeColors } from '../theme'
import type {
	HapticImpact,
	HapticNotification,
	Platform,
	PlatformAuthPayload,
	PlatformFeature,
	PlatformHaptic,
	PlatformStorage,
	PlatformUser,
	PlatformViewport,
	SafeArea
} from '../types'
import { WebStorage } from './storage'

const log = createLogger('web-platform')

export interface TelegramLoginData {
	id: number
	first_name: string
	last_name?: string
	username?: string
	photo_url?: string
	auth_date: number
	hash: string
}

class NoopHaptic implements PlatformHaptic {
	impact(_style: HapticImpact): void {}
	notification(_type: HapticNotification): void {}
	selection(): void {}
}

class WebViewport implements PlatformViewport {
	get width() {
		return typeof window !== 'undefined' ? window.innerWidth : 0
	}
	get height() {
		return typeof window !== 'undefined' ? window.innerHeight : 0
	}
	isExpanded = true
	safeArea: SafeArea = { top: 0, bottom: 0, left: 0, right: 0 }

	async expand(): Promise<void> {}
}

export class WebPlatform implements Platform {
	readonly type = 'web' as const

	private _ready = false
	private user: PlatformUser | null = null
	private authPayload: PlatformAuthPayload | null = null

	readonly storage: PlatformStorage = new WebStorage()
	readonly haptic: PlatformHaptic = new NoopHaptic()
	readonly viewport: PlatformViewport = new WebViewport()

	get ready() {
		return this._ready
	}

	async init(): AsyncResult<void> {
		this.applyTheme()
		this._ready = true
		log.info('initialized')
		return ok(undefined)
	}

	async dispose(): Promise<void> {
		this._ready = false
	}

	applyTheme(): void {
		const root = document.documentElement
		root.dataset.platform = 'web'

		const isDark =
			typeof window !== 'undefined'
				? window.matchMedia('(prefers-color-scheme: dark)').matches
				: false

		applyThemeColors({}, isDark)
		applySafeArea({ top: 0, bottom: 0, left: 0, right: 0 })
	}

	setTelegramLoginData(data: TelegramLoginData): void {
		log.debug('setting telegram login data', { userId: data.id })

		this.user = {
			id: String(data.id),
			platformId: data.id,
			firstName: data.first_name,
			lastName: data.last_name,
			username: data.username,
			photoUrl: data.photo_url
		}

		this.authPayload = {
			platform: 'web',
			data: JSON.stringify({
				telegram_id: data.id,
				username: data.username,
				first_name: data.first_name,
				last_name: data.last_name,
				photo_url: data.photo_url,
				auth_date: new Date(data.auth_date * 1000).toISOString(),
				hash: data.hash
			})
		}
	}

	getUser(): PlatformUser | null {
		return this.user
	}

	getAuthPayload(): PlatformAuthPayload | null {
		return this.authPayload
	}

	hasFeature(_feature: PlatformFeature): boolean {
		return false
	}
}

export class DevWebPlatform implements Platform {
	readonly type = 'web' as const

	private _ready = false
	private readonly user: PlatformUser
	private readonly authPayload: PlatformAuthPayload

	readonly storage: PlatformStorage = new WebStorage()
	readonly haptic: PlatformHaptic = new NoopHaptic()
	readonly viewport: PlatformViewport = new WebViewport()

	constructor() {
		const userId = Number(import.meta.env.VITE_DEV_USER_ID || 999999999)
		const username = import.meta.env.VITE_DEV_USER_NAME || 'dev_user'
		const firstName = import.meta.env.VITE_DEV_USER_FIRST_NAME || 'Dev'

		this.user = {
			id: String(userId),
			platformId: userId,
			firstName,
			username,
			photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
		}

		this.authPayload = {
			platform: 'web',
			data: JSON.stringify({
				telegram_id: userId,
				username,
				first_name: firstName,
				auth_date: new Date().toISOString(),
				hash: 'dev-fake-hash'
			})
		}
	}

	get ready() {
		return this._ready
	}

	async init(): AsyncResult<void> {
		this.applyTheme()
		this._ready = true
		log.info('dev platform initialized', { user: this.user.username })
		return ok(undefined)
	}

	async dispose(): Promise<void> {
		this._ready = false
	}

	applyTheme(): void {
		const root = document.documentElement
		root.dataset.platform = 'web'
		applyThemeColors({}, false)
		applySafeArea({ top: 0, bottom: 0, left: 0, right: 0 })
	}

	getUser(): PlatformUser | null {
		return this.user
	}

	getAuthPayload(): PlatformAuthPayload | null {
		return this.authPayload
	}

	hasFeature(_feature: PlatformFeature): boolean {
		return false
	}
}
