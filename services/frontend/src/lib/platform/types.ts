import type { AsyncResult } from '$lib/shared/types'

// user data normalized across platforms
export interface PlatformUser {
	id: string
	platformId: number
	firstName: string
	lastName?: string
	username?: string
	photoUrl?: string
	languageCode?: string
}

// auth data that will be sent to backend for verification
export interface PlatformAuthPayload {
	platform: 'telegram' | 'web'
	data: string
	signature?: string
}

// storage interface - simplified
export interface PlatformStorage {
	get(key: string): AsyncResult<string | null>
	set(key: string, value: string): AsyncResult<void>
	remove(key: string): AsyncResult<void>
	clear(): AsyncResult<void>
}

// haptic feedback
export type HapticImpact = 'light' | 'medium' | 'heavy'
export type HapticNotification = 'success' | 'warning' | 'error'

export interface PlatformHaptic {
	impact(style: HapticImpact): void
	notification(type: HapticNotification): void
	selection(): void
}

// theme from platform
export interface PlatformTheme {
	isDark: boolean
	colors: {
		bg: string
		text: string
		hint: string
		link: string
		button: string
		buttonText: string
		secondaryBg: string
	}
	safeArea: {
		top: number
		bottom: number
		left: number
		right: number
	}
}

// viewport control
export interface PlatformViewport {
	readonly width: number
	readonly height: number
	readonly isExpanded: boolean
	expand(): Promise<void>
}

// main platform adapter interface
export interface Platform {
	readonly type: 'telegram' | 'web'
	readonly ready: boolean

	// lifecycle
	init(): AsyncResult<void>
	dispose(): Promise<void>

	// auth
	getUser(): PlatformUser | null
	getAuthPayload(): PlatformAuthPayload | null

	// features
	readonly storage: PlatformStorage
	readonly haptic: PlatformHaptic
	readonly theme: PlatformTheme
	readonly viewport: PlatformViewport

	// capabilities
	hasFeature(feature: PlatformFeature): boolean
}

export type PlatformFeature =
	| 'cloud_storage'
	| 'haptic'
	| 'theme'
	| 'qr_scanner'
	| 'share'
	| 'biometry'
