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
	verticalTolerance: 60
}

export class SwipeController {
	private enabled = $state(true)
	private startX = 0
	private startY = 0
	private currentPath = $state('/')
	private platform: Platform | null = null
	private config: SwipeConfig

	private cleanup: (() => void) | null = null

	constructor(config: Partial<SwipeConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config }
	}

	// initialize global listeners
	init(platform: Platform) {
		if (typeof window === 'undefined') return

		this.platform = platform

		const onTouchStart = (e: TouchEvent) => this.handleTouchStart(e)
		const onTouchMove = (e: TouchEvent) => this.handleTouchMove(e)
		const onTouchEnd = (e: TouchEvent) => this.handleTouchEnd(e)

		window.addEventListener('touchstart', onTouchStart, { passive: true })
		// passive: false is needed to allow preventDefault if we wanted to block scroll,
		// but for back/forward nav we usually keep it passive to not block scrolling
		window.addEventListener('touchmove', onTouchMove, { passive: false })
		window.addEventListener('touchend', onTouchEnd)

		this.cleanup = () => {
			window.removeEventListener('touchstart', onTouchStart)
			window.removeEventListener('touchmove', onTouchMove)
			window.removeEventListener('touchend', onTouchEnd)
		}
	}

	destroy() {
		this.cleanup?.()
	}

	setPath(path: string) {
		this.currentPath = path
	}

	private handleTouchStart(e: TouchEvent): void {
		if (!this.enabled) return
		this.startX = e.touches[0].clientX
		this.startY = e.touches[0].clientY
	}

	private handleTouchMove(e: TouchEvent): void {
		if (!this.enabled) return

		const deltaX = e.touches[0].clientX - this.startX
		const deltaY = e.touches[0].clientY - this.startY

		// determine if this is a horizontal swipe intent
		const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY)

		// check vertical tolerance
		if (Math.abs(deltaY) > this.config.verticalTolerance) {
			return
		}

		// optional: if purely horizontal strong swipe, prevent default (scroll)
		if (isHorizontal && Math.abs(deltaX) > 10) {
			// e.preventDefault() // enable if you want to lock usage while swiping
		}
	}

	private handleTouchEnd(e: TouchEvent): void {
		if (!this.enabled) return

		const deltaX = e.changedTouches[0].clientX - this.startX
		const deltaY = e.changedTouches[0].clientY - this.startY

		// ignore if too much vertical movement
		if (Math.abs(deltaY) > this.config.verticalTolerance) return

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
		// @ts-expect-error paths are typed strictly in sveltekit but loose here
		goto(resolve(path)).catch(() => {})
	}
}

export const swipeController = new SwipeController()
