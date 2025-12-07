import { createLogger } from '$lib/shared/logger'
import { type AsyncResult, ok } from '$lib/shared/types'
import { applySafeArea, applyThemePalette } from '$lib/theme/injector'
import type { ThemePalette } from '$lib/theme/types'

import type {
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

// Themes definition
const LIGHT_THEME: ThemePalette = {
	bg: '#ffffff',
	bgSecondary: '#f1f5f9',
	bgTertiary: '#e2e8f0',
	text: '#0f172a',
	textSecondary: '#475569',
	textTertiary: '#94a3b8',
	primary: '#3b82f6',
	primaryText: '#ffffff',
	error: '#ef4444',
	success: '#10b981'
}

const DARK_THEME: ThemePalette = {
	bg: '#0f172a',
	bgSecondary: '#1e293b',
	bgTertiary: '#334155',
	text: '#f8fafc',
	textSecondary: '#cbd5e1',
	textTertiary: '#64748b',
	primary: '#60a5fa',
	primaryText: '#0f172a',
	error: '#f87171',
	success: '#34d399'
}

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
	impact(): void {}
	notification(): void {}
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
		const isDark =
			typeof window !== 'undefined'
				? window.matchMedia('(prefers-color-scheme: dark)').matches
				: false

		applyThemePalette(isDark ? DARK_THEME : LIGHT_THEME)
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

	getUser() {
		return this.user
	}
	getAuthPayload() {
		return this.authPayload
	}
	hasFeature() {
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
