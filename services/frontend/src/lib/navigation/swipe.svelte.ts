import { goto } from '$app/navigation'
import { resolve } from '$app/paths'
import type { Platform } from '$lib/platform/types'

import { getRouteIndex, NAV_ROUTES } from './routes'

export interface SwipeConfig {
	threshold: number
	verticalTolerance: number
}

const DEFAULT_CONFIG: SwipeConfig = {
	threshold: 80,
	verticalTolerance: 50
}

export class SwipeController {
	private enabled = $state(true)
	private startX = 0
	private startY = 0
	private currentPath = '/'
	private platform: Platform | null = null
	private config: SwipeConfig

	constructor(config: Partial<SwipeConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config }
	}

	setPlatform(platform: Platform): void {
		this.platform = platform
	}

	setCurrentPath(path: string): void {
		this.currentPath = path
	}

	enable(): void {
		this.enabled = true
	}

	disable(): void {
		this.enabled = false
	}

	get isEnabled(): boolean {
		return this.enabled
	}

	handleTouchStart(e: TouchEvent): void {
		if (!this.enabled) return
		this.startX = e.touches[0].clientX
		this.startY = e.touches[0].clientY
	}

	handleTouchMove(e: TouchEvent): boolean {
		if (!this.enabled) return false

		const deltaX = e.touches[0].clientX - this.startX
		const deltaY = e.touches[0].clientY - this.startY

		// if scrolling vertically, don't interfere
		if (
			Math.abs(deltaY) > this.config.verticalTolerance &&
			Math.abs(deltaY) > Math.abs(deltaX)
		) {
			return false
		}

		// horizontal swipe detected
		if (Math.abs(deltaX) > 15) {
			return true // should prevent default
		}

		return false
	}

	handleTouchEnd(e: TouchEvent): void {
		if (!this.enabled) return

		const deltaX = e.changedTouches[0].clientX - this.startX
		const currentIndex = getRouteIndex(this.currentPath)

		if (currentIndex === -1) return

		if (deltaX > this.config.threshold && currentIndex > 0) {
			this.navigate(NAV_ROUTES[currentIndex - 1])
		} else if (deltaX < -this.config.threshold && currentIndex < NAV_ROUTES.length - 1) {
			this.navigate(NAV_ROUTES[currentIndex + 1])
		}
	}

	private navigate(path: string): void {
		this.platform?.haptic.impact('light')
		// @ts-expect-error paths
		goto(resolve(path)).catch()
	}
}

// singleton for app-wide swipe control
export const swipeController = new SwipeController()
