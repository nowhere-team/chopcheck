import { goto } from '$app/navigation'
import { resolve } from '$app/paths'
import type { Platform } from '$lib/platform/types'

import { getRouteIndex, NAV_ROUTES } from './routes'

export interface SwipeConfig {
	threshold: number
	verticalTolerance: number
	angleFactor: number
	minVelocity: number
}

const DEFAULT_CONFIG: SwipeConfig = {
	threshold: 105,
	verticalTolerance: 60,
	angleFactor: 1.3,
	minVelocity: 0.25
}

export class SwipeController {
	private enabled = $state(true)
	private startX = 0
	private startY = 0
	private startTime = 0
	private currentPath = $state('/')
	private platform: Platform | null = null
	private config: SwipeConfig
	private cleanup: (() => void) | null = null

	constructor(config: Partial<SwipeConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config }
	}

	init(platform: Platform) {
		if (typeof window === 'undefined') return
		this.platform = platform

		const onTouchStart = (e: TouchEvent) => this.handleStart(e)
		const onTouchMove = (e: TouchEvent) => this.handleMove(e)
		const onTouchEnd = (e: TouchEvent) => this.handleEnd(e)

		window.addEventListener('touchstart', onTouchStart, { passive: true })
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

	disable() {
		this.enabled = false
	}

	enable() {
		this.enabled = true
	}

	setPath(path: string) {
		this.currentPath = path
	}

	private handleStart(e: TouchEvent): void {
		if (!this.enabled || e.touches.length !== 1) return

		const touch = e.touches[0]
		this.startX = touch.clientX
		this.startY = touch.clientY
		this.startTime = Date.now()
	}

	private handleMove(e: TouchEvent): void {
		if (!this.enabled || e.touches.length !== 1) return

		const touch = e.touches[0]
		const deltaX = touch.clientX - this.startX
		const deltaY = touch.clientY - this.startY

		if (Math.abs(deltaY) * this.config.angleFactor > Math.abs(deltaX)) {
			return
		}

		if (Math.abs(deltaX) > 20 && e.cancelable) {
			e.preventDefault()
		}
	}

	private handleEnd(e: TouchEvent): void {
		if (!this.enabled || e.changedTouches.length !== 1) return

		const touch = e.changedTouches[0]
		const deltaX = touch.clientX - this.startX
		const timeElapsed = Math.max(Date.now() - this.startTime, 1)
		const distance = Math.abs(deltaX)
		const velocity = distance / timeElapsed

		const currentIndex = getRouteIndex(this.currentPath)
		if (currentIndex === -1) return

		const passedThreshold = distance > this.config.threshold
		const passedVelocity = velocity > this.config.minVelocity
		const isIntentional = passedThreshold && passedVelocity

		if (!isIntentional) {
			return
		}

		if (deltaX > 0 && currentIndex > 0) {
			this.navigate(NAV_ROUTES[currentIndex - 1])
		} else if (deltaX < 0 && currentIndex < NAV_ROUTES.length - 1) {
			this.navigate(NAV_ROUTES[currentIndex + 1])
		}
	}

	private navigate(path: string): void {
		this.platform?.haptic.impact('medium')
		// @ts-expect-error weak types in router
		goto(resolve(path)).catch(() => {})
	}
}

export const swipeController = new SwipeController()
