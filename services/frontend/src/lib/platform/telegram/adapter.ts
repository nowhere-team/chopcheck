import { retrieveLaunchParams, type RetrieveLPResult as LaunchParams } from '@telegram-apps/sdk'

import { createLogger } from '$lib/shared/logger'
import { type AsyncResult, err, ok } from '$lib/shared/types'
import { applySafeArea, applyThemePalette } from '$lib/theme/injector'
import type { ThemePalette } from '$lib/theme/types'

import type {
	HapticImpact,
	HapticNotification,
	Platform,
	PlatformAuthPayload,
	PlatformFeature,
	PlatformHaptic,
	PlatformStorage,
	PlatformViewport,
	SafeArea
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

	get viewport(): PlatformViewport {
		return this._viewport ?? DEFAULT_VIEWPORT
	}

	async init(): AsyncResult<void> {
		try {
			log.debug('retrieving launch params')
			this.launchParams = retrieveLaunchParams()

			log.debug('importing sdk')
			this.sdk = await import('@telegram-apps/sdk')
			this.sdk.init()

			if (this.sdk.viewport.mount.isAvailable()) {
				await this.sdk.viewport.mount()
			}

			if (
				this.isMobile(this.launchParams.tgWebAppPlatform) &&
				this.sdk.viewport.requestFullscreen.isAvailable()
			) {
				this.sdk.viewport.requestFullscreen()
			}

			if (this.sdk.miniApp.mountSync.isAvailable()) {
				this.sdk.miniApp.mountSync()
			}
			if (this.sdk.miniApp.ready.isAvailable()) {
				this.sdk.miniApp.ready()
			}

			this.cloudStorage = new TelegramCloudStorage()
			const storageOk = await this.cloudStorage.init()
			if (!storageOk) {
				log.warn('cloud storage unavailable, using localStorage')
				this.cloudStorage = null
			}

			this._haptic = new TelegramHaptic(this.sdk)
			this._viewport = new TelegramViewport(this.sdk)

			this.applyTheme()
			this._ready = true

			log.info('initialized')

			return ok(undefined)
		} catch (e) {
			log.error('init failed', e)
			return err(e instanceof Error ? e : new Error('telegram init failed'))
		}
	}

	async dispose(): Promise<void> {
		if (this.sdk) {
			this.sdk.viewport.unmount()
			this.sdk.miniApp.unmount()
		}
		this._ready = false
	}

	// Helper to unwrap signals/functions from Telegram SDK
	private getColor(prop: any, fallback: string): string {
		if (!prop) return fallback
		const value = typeof prop === 'function' ? prop() : prop
		return value || fallback
	}

	applyTheme(): void {
		if (!this.sdk) return

		try {
			const tp = this.sdk.themeParams

			const bg = this.getColor(tp.backgroundColor, '#ffffff')
			const text = this.getColor(tp.textColor, '#000000')
			const hint = this.getColor(tp.hintColor, '#999999')
			const button = this.getColor(tp.buttonColor, '#3b82f6')
			const buttonText = this.getColor(tp.buttonTextColor, '#ffffff')
			const secondaryBg = this.getColor(tp.secondaryBackgroundColor, '#f1f5f9')

			const palette: ThemePalette = {
				bg: bg,
				bgSecondary: this.getColor(tp.sectionBackgroundColor, secondaryBg),
				bgTertiary: `color-mix(in srgb, ${hint} 15%, ${bg})`,

				text: text,
				textSecondary: this.getColor(tp.subtitleTextColor, hint),
				textTertiary: `color-mix(in srgb, ${hint} 60%, ${bg})`,

				primary: button,
				primaryText: buttonText,

				error: '#ef4444',
				success: '#10b981'
			}

			applyThemePalette(palette)

			const sa = this.sdk.viewport.safeAreaInsets()
			applySafeArea({ top: sa.top, bottom: sa.bottom, left: sa.left, right: sa.right })
		} catch (e) {
			log.warn('failed to apply theme', e)
		}
	}

	getUser() {
		const webAppUser = this.launchParams?.tgWebAppData?.user
		if (!webAppUser) return null

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
		if (!webAppData?.user) return null

		return {
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
	}

	getAppPlatform(): string | null {
		return this.launchParams?.tgWebAppPlatform ?? null
	}

	hasFeature(feature: PlatformFeature): boolean {
		if (!this.sdk) return false

		switch (feature) {
			case 'cloud_storage':
				return this.cloudStorage !== null
			case 'haptic':
				return this.sdk.hapticFeedback.isSupported()
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

	private isMobile(platform: string) {
		return platform === 'ios' || platform === 'android'
	}
}

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

class TelegramViewport implements PlatformViewport {
	constructor(private sdk: TelegramSDK) {}

	get width(): number {
		try {
			return this.sdk.viewport.width()
		} catch {
			return window.innerWidth
		}
	}

	get height(): number {
		try {
			return this.sdk.viewport.height()
		} catch {
			return window.innerHeight
		}
	}

	get isExpanded(): boolean {
		try {
			return this.sdk.viewport.isExpanded()
		} catch {
			return true
		}
	}

	get safeArea(): SafeArea {
		try {
			const sa = this.sdk.viewport.safeAreaInsets()
			return { top: sa.top, bottom: sa.bottom, left: sa.left, right: sa.right }
		} catch {
			return { top: 0, bottom: 0, left: 0, right: 0 }
		}
	}

	async expand(): Promise<void> {
		try {
			if (this.sdk.viewport.expand.isAvailable()) {
				this.sdk.viewport.expand()
			}
		} catch {
			/* ignore */
		}
	}
}

const DEFAULT_VIEWPORT: PlatformViewport = {
	width: typeof window !== 'undefined' ? window.innerWidth : 0,
	height: typeof window !== 'undefined' ? window.innerHeight : 0,
	isExpanded: true,
	safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
	expand: async () => {}
}
