// file: services/frontend/src/lib/platform/types.ts
import type { AsyncResult } from '$lib/shared/types'

export interface PlatformUser {
	id: string
	platformId: number
	firstName: string
	lastName?: string
	username?: string
	photoUrl?: string
	languageCode?: string
}

export interface PlatformAuthPayload {
	platform: 'telegram' | 'web'
	data: string
	signature?: string
}

export interface PlatformStorage {
	get(key: string): AsyncResult<string | null>
	set(key: string, value: string): AsyncResult<void>
	remove(key: string): AsyncResult<void>
	clear(): AsyncResult<void>
}

export type HapticImpact = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
export type HapticNotification = 'success' | 'warning' | 'error'

export interface PlatformHaptic {
	impact(style: HapticImpact): void
	notification(type: HapticNotification): void
	selection(): void
}

export interface SafeArea {
	top: number
	bottom: number
	left: number
	right: number
}

export interface PlatformViewport {
	readonly width: number
	readonly height: number
	readonly isExpanded: boolean
	readonly safeArea: SafeArea
	expand(): Promise<void>
}

export interface Platform {
	readonly type: 'telegram' | 'web'
	readonly ready: boolean

	init(): AsyncResult<void>
	dispose(): Promise<void>

	getUser(): PlatformUser | null
	getAuthPayload(): PlatformAuthPayload | null

	readonly storage: PlatformStorage
	readonly haptic: PlatformHaptic
	readonly viewport: PlatformViewport

	hasFeature(feature: PlatformFeature): boolean

	// theme is applied directly to css variables, no js interface needed
	applyTheme(): void
}

export type PlatformFeature = 'cloud_storage' | 'haptic' | 'qr_scanner' | 'share' | 'biometry'
