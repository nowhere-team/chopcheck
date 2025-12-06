import { retrieveLaunchParams, type RetrieveLPResult as LaunchParams } from '@telegram-apps/sdk'

import { createLogger } from '$lib/shared/logger'
import { type AsyncResult, err, ok } from '$lib/shared/types'

import type {
	HapticImpact,
	HapticNotification,
	Platform,
	PlatformAuthPayload,
	PlatformFeature,
	PlatformHaptic,
	PlatformStorage,
	PlatformTheme,
	PlatformUser,
	PlatformViewport
} from '../types'
import { WebStorage } from '../web/storage'
import { TelegramCloudStorage } from './storage'

type TelegramSDK = typeof import('@telegram-apps/sdk')

const log = createLogger('telegram')

export class TelegramPlatform implements Platform {
	readonly type = 'telegram' as const

	private _ready = false
	private sdk: TelegramSDK | null = null
	private cloudStorage: TelegramCloudStorage | null = null
	private fallbackStorage = new WebStorage()
	private launchParams: LaunchParams | null = null

	private _haptic: TelegramHaptic | null = null
	private _theme: TelegramTheme | null = null
	private _viewport: TelegramViewport | null = null

	get ready() {
		return this._ready
	}

	get storage(): PlatformStorage {
		return this.cloudStorage ?? this.fallbackStorage
	}

	get haptic(): PlatformHaptic {
		return this._haptic ?? new NoopHaptic()
	}

	get theme(): PlatformTheme {
		return this._theme ?? DEFAULT_THEME
	}

	get viewport(): PlatformViewport {
		return this._viewport ?? DEFAULT_VIEWPORT
	}

	async init(): AsyncResult<void> {
		try {
			log.debug('retrieving launch params')
			this.launchParams = retrieveLaunchParams()
			log.debug('launch params retrieved', {
				platform: this.launchParams.tgWebAppPlatform,
				hasUser: !!this.launchParams.tgWebAppData?.user
			})

			log.debug('importing sdk')
			this.sdk = await import('@telegram-apps/sdk')
			this.sdk.init()
			log.debug('sdk initialized')

			// mount viewport
			if (this.sdk.viewport.mount.isAvailable()) {
				await this.sdk.viewport.mount()
				log.debug('viewport mounted')
			}

			if (this.sdk.viewport.expand.isAvailable()) {
				await this.sdk.viewport.expand()
				log.debug('viewport expanded')
			}

			// signal ready to telegram
			if (this.sdk.miniApp.mount.isAvailable()) {
				await this.sdk.miniApp.mount()
			}
			if (this.sdk.miniApp.ready.isAvailable()) {
				this.sdk.miniApp.ready()
				log.debug('miniApp ready signaled')
			}

			// init cloud storage
			this.cloudStorage = new TelegramCloudStorage()
			const storageOk = await this.cloudStorage.init()
			if (!storageOk) {
				log.warn('cloud storage unavailable, using localStorage')
				this.cloudStorage = null
			} else {
				log.debug('cloud storage initialized')
			}

			// init feature providers
			this._haptic = new TelegramHaptic(this.sdk)
			this._theme = new TelegramTheme(this.sdk)
			this._viewport = new TelegramViewport(this.sdk)

			this._theme.apply()
			this._ready = true

			log.info('platform initialized successfully')
			return ok(undefined)
		} catch (e) {
			log.error('initialization failed', e)
			return err(e instanceof Error ? e : new Error('telegram init failed'))
		}
	}

	async dispose(): Promise<void> {
		if (this.sdk) {
			this.sdk.viewport.unmount()
			this.sdk.miniApp.unmount()
		}
		this._ready = false
		log.debug('disposed')
	}

	getUser(): PlatformUser | null {
		const webAppUser = this.launchParams?.tgWebAppData?.user
		if (!webAppUser) {
			log.debug('no user in launch params')
			return null
		}

		return {
			id: String(webAppUser.id),
			platformId: webAppUser.id,
			firstName: webAppUser.first_name,
			lastName: webAppUser.last_name,
			username: webAppUser.username,
			photoUrl: webAppUser.photo_url,
			languageCode: webAppUser.language_code
		}
	}

	getAuthPayload(): PlatformAuthPayload | null {
		const webAppData = this.launchParams?.tgWebAppData
		if (!webAppData?.user) {
			log.warn('no tgWebAppData.user in launch params')
			return null
		}

		const payload: PlatformAuthPayload = {
			platform: 'telegram',
			data: JSON.stringify({
				telegram_id: webAppData.user.id,
				username: webAppData.user.username,
				first_name: webAppData.user.first_name,
				last_name: webAppData.user.last_name,
				photo_url: webAppData.user.photo_url,
				auth_date: webAppData.auth_date,
				hash: webAppData.hash
			})
		}

		log.debug('auth payload created', { telegramId: webAppData.user.id })
		return payload
	}

	hasFeature(feature: PlatformFeature): boolean {
		if (!this.sdk) return false

		switch (feature) {
			case 'cloud_storage':
				return this.cloudStorage !== null
			case 'haptic':
				return this.sdk.hapticFeedback.isSupported()
			case 'theme':
				return true
			case 'qr_scanner':
				return this.sdk.qrScanner.isSupported()
			case 'share':
				return this.sdk.shareURL.isAvailable()
			case 'biometry':
				return this.sdk.biometry.isSupported()
			default:
				return false
		}
	}
}

// haptic

class NoopHaptic implements PlatformHaptic {
	impact() {}
	notification() {}
	selection() {}
}

class TelegramHaptic implements PlatformHaptic {
	constructor(private sdk: TelegramSDK) {}

	impact(style: HapticImpact): void {
		if (this.sdk.hapticFeedback.isSupported()) {
			this.sdk.hapticFeedback.impactOccurred(style)
		}
	}

	notification(type: HapticNotification): void {
		if (this.sdk.hapticFeedback.isSupported()) {
			this.sdk.hapticFeedback.notificationOccurred(type)
		}
	}

	selection(): void {
		if (this.sdk.hapticFeedback.isSupported()) {
			this.sdk.hapticFeedback.selectionChanged()
		}
	}
}

// theme

class TelegramTheme implements PlatformTheme {
	constructor(private sdk: TelegramSDK) {}

	get isDark(): boolean {
		try {
			const bg = this.sdk.themeParams.backgroundColor?.() ?? '#ffffff'
			return calculateIsDark(bg)
		} catch {
			return false
		}
	}

	get colors() {
		try {
			const tp = this.sdk.themeParams
			return {
				bg: tp.backgroundColor?.() ?? '#ffffff',
				text: tp.textColor?.() ?? '#000000',
				hint: tp.hintColor?.() ?? '#999999',
				link: tp.linkColor?.() ?? '#3390ec',
				button: tp.buttonColor?.() ?? '#3390ec',
				buttonText: tp.buttonTextColor?.() ?? '#ffffff',
				secondaryBg: tp.secondaryBackgroundColor?.() ?? '#f0f0f0'
			}
		} catch {
			return DEFAULT_THEME.colors
		}
	}

	get safeArea() {
		try {
			const sa = this.sdk.viewport.safeAreaInsets()
			return { top: sa.top, bottom: sa.bottom, left: sa.left, right: sa.right }
		} catch {
			return { top: 0, bottom: 0, left: 0, right: 0 }
		}
	}

	apply(): void {
		const root = document.documentElement
		root.dataset.platform = 'telegram'
		root.dataset.theme = this.isDark ? 'dark' : 'light'

		const colors = this.colors
		Object.entries(colors).forEach(([key, value]) => {
			root.style.setProperty(`--color-${key}`, value)
		})

		const { top, bottom, left, right } = this.safeArea
		root.style.setProperty('--safe-area-top', `${top}px`)
		root.style.setProperty('--safe-area-bottom', `${bottom}px`)
		root.style.setProperty('--safe-area-left', `${left}px`)
		root.style.setProperty('--safe-area-right', `${right}px`)
	}
}

// viewport

class TelegramViewport implements PlatformViewport {
	constructor(private sdk: TelegramSDK) {}

	get width(): number {
		try {
			return this.sdk.viewport.width()
		} catch {
			return typeof window !== 'undefined' ? window.innerWidth : 0
		}
	}

	get height(): number {
		try {
			return this.sdk.viewport.height()
		} catch {
			return typeof window !== 'undefined' ? window.innerHeight : 0
		}
	}

	get isExpanded(): boolean {
		try {
			return this.sdk.viewport.isExpanded()
		} catch {
			return true
		}
	}

	async expand(): Promise<void> {
		try {
			if (this.sdk.viewport.expand.isAvailable()) {
				await this.sdk.viewport.expand()
			}
		} catch (e) {
			log.warn('failed to expand viewport', e)
		}
	}
}

// helpers

function calculateIsDark(bgColor: string): boolean {
	const rgb = parseInt(bgColor.slice(1), 16)
	const r = (rgb >> 16) & 0xff
	const g = (rgb >> 8) & 0xff
	const b = rgb & 0xff
	const brightness = (r * 299 + g * 587 + b * 114) / 1000
	return brightness < 128
}

// defaults

const DEFAULT_THEME: PlatformTheme = {
	isDark: false,
	colors: {
		bg: '#ffffff',
		text: '#000000',
		hint: '#999999',
		link: '#3390ec',
		button: '#3390ec',
		buttonText: '#ffffff',
		secondaryBg: '#f0f0f0'
	},
	safeArea: { top: 0, bottom: 0, left: 0, right: 0 }
}

const DEFAULT_VIEWPORT: PlatformViewport = {
	width: typeof window !== 'undefined' ? window.innerWidth : 0,
	height: typeof window !== 'undefined' ? window.innerHeight : 0,
	isExpanded: true,
	expand: async () => {}
}
