import { goto } from '$app/navigation'
import { resolve } from '$app/paths'
import type { RouteId } from '$app/types'
import type { Platform } from '$lib/platform/types'

import { getRouteIndex, NAV_ROUTES } from './routes'

const THRESHOLD = 70
const VELOCITY_THRESHOLD = 0.25
const VERTICAL_LIMIT = 1.5

class SwipeController {
	private platform: Platform | null = null
	private currentPath = '/'
	private enabled = true
	private navigating = false

	private startX = 0
	private startY = 0
	private startTime = 0
	private isTracking = false

	init(platform: Platform) {
		if (typeof window === 'undefined') return

		this.platform = platform

		window.addEventListener('touchstart', this.onTouchStart, { passive: true })
		window.addEventListener('touchmove', this.onTouchMove, { passive: false })
		window.addEventListener('touchend', this.onTouchEnd, { passive: true })
	}

	destroy() {
		window.removeEventListener('touchstart', this.onTouchStart)
		window.removeEventListener('touchmove', this.onTouchMove)
		window.removeEventListener('touchend', this.onTouchEnd)
	}

	setPath(path: string) {
		this.currentPath = path
		this.navigating = false
	}

	disable() {
		this.enabled = false
	}

	enable() {
		this.enabled = true
	}

	private onTouchStart = (e: TouchEvent) => {
		if (!this.enabled || this.navigating || e.touches.length !== 1) return

		const touch = e.touches[0]

		// skip edge zones (system gestures)
		if (touch.clientX < 30 || touch.clientX > window.innerWidth - 30) return

		this.startX = touch.clientX
		this.startY = touch.clientY
		this.startTime = Date.now()
		this.isTracking = true
	}

	private onTouchMove = (e: TouchEvent) => {
		if (!this.isTracking || e.touches.length !== 1) return

		const touch = e.touches[0]
		const dx = Math.abs(touch.clientX - this.startX)
		const dy = Math.abs(touch.clientY - this.startY)

		// if scrolling vertically, stop tracking
		if (dy > dx * VERTICAL_LIMIT) {
			this.isTracking = false
			return
		}

		// if clearly horizontal, prevent scroll
		if (dx > 15 && dx > dy * 1.2 && e.cancelable) {
			e.preventDefault()
		}
	}

	private onTouchEnd = (e: TouchEvent) => {
		if (!this.isTracking || e.changedTouches.length !== 1) {
			this.isTracking = false
			return
		}

		const touch = e.changedTouches[0]
		const dx = touch.clientX - this.startX
		const dy = touch.clientY - this.startY
		const absDx = Math.abs(dx)
		const absDy = Math.abs(dy)
		const elapsed = Date.now() - this.startTime
		const velocity = absDx / Math.max(elapsed, 1)

		this.isTracking = false

		// validate gesture
		if (absDy > absDx * VERTICAL_LIMIT) return
		if (absDx < THRESHOLD) return
		if (velocity < VELOCITY_THRESHOLD) return

		const idx = getRouteIndex(this.currentPath)
		if (idx === -1) return

		let target: RouteId | null = null

		if (dx > 0 && idx > 0) {
			target = NAV_ROUTES[idx - 1]
		} else if (dx < 0 && idx < NAV_ROUTES.length - 1) {
			target = NAV_ROUTES[idx + 1]
		}

		if (target) {
			this.navigating = true
			this.platform?.haptic.impact('medium')
			goto(resolve(target))
		}
	}
}

export const swipeController = new SwipeController()
