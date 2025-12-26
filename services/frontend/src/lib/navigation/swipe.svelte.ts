import { goto } from '$app/navigation'
import { resolve } from '$app/paths'
import type { RouteId } from '$app/types'
import type { Platform } from '$lib/platform/types'

import { getRouteIndex, NAV_ROUTES } from './routes'

const THRESHOLD = 50 // was 70
const VELOCITY_THRESHOLD = 0.15 // was 0.25 - more sensitive
const VERTICAL_LIMIT = 2 // was 1.5 - more forgiving for diagonal swipes

class SwipeController {
	private platform: Platform | null = null
	private currentPath = '/'
	private enabled = true
	private navigating = false

	private startX = 0
	private startY = 0
	private startTime = 0
	private currentX = 0
	private isTracking = false
	private contentEl: HTMLElement | null = null

	init(platform: Platform) {
		if (typeof window === 'undefined') return

		this.platform = platform
		this.contentEl = document.querySelector('.content')

		window.addEventListener('touchstart', this.onTouchStart, { passive: true })
		window.addEventListener('touchmove', this.onTouchMove, { passive: false })
		window.addEventListener('touchend', this.onTouchEnd, { passive: true })
	}

	destroy() {
		window.removeEventListener('touchstart', this.onTouchStart)
		window.removeEventListener('touchmove', this.onTouchMove)
		window.removeEventListener('touchend', this.onTouchEnd)
		this.contentEl = null
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
		if (touch.clientX < 20 || touch.clientX > window.innerWidth - 20) return

		this.startX = touch.clientX
		this.startY = touch.clientY
		this.currentX = 0
		this.startTime = Date.now()
		this.isTracking = true
		this.contentEl = document.querySelector('.content')
	}

	private onTouchMove = (e: TouchEvent) => {
		if (!this.isTracking || e.touches.length !== 1) return

		const touch = e.touches[0]
		const dx = touch.clientX - this.startX
		const dy = Math.abs(touch.clientY - this.startY)
		const absDx = Math.abs(dx)

		// if scrolling vertically, stop tracking
		if (dy > absDx * VERTICAL_LIMIT) {
			this.isTracking = false
			this.resetVisual()
			return
		}

		// check if we can navigate in this direction
		const idx = getRouteIndex(this.currentPath)
		if (idx === -1) return

		const canGoLeft = dx > 0 && idx > 0
		const canGoRight = dx < 0 && idx < NAV_ROUTES.length - 1

		if (!canGoLeft && !canGoRight) {
			return
		}

		// if clearly horizontal, prevent scroll and show visual feedback
		if (absDx > 10 && e.cancelable) {
			e.preventDefault()
			this.currentX = dx

			// visual feedback - slight movement of current page
			if (this.contentEl) {
				const progress = Math.min(absDx / 150, 1)
				const translateX = dx * 0.15 // subtle follow
				const opacity = 1 - progress * 0.1
				this.contentEl.style.transform = `translateX(${translateX}px)`
				this.contentEl.style.opacity = String(opacity)
				this.contentEl.style.transition = 'none'
			}
		}
	}

	private onTouchEnd = (e: TouchEvent) => {
		if (!this.isTracking || e.changedTouches.length !== 1) {
			this.isTracking = false
			this.resetVisual()
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
		if (absDy > absDx * VERTICAL_LIMIT) {
			this.resetVisual()
			return
		}

		// either threshold or velocity should be enough
		const passedThreshold = absDx >= THRESHOLD
		const passedVelocity = velocity >= VELOCITY_THRESHOLD && absDx > 30

		if (!passedThreshold && !passedVelocity) {
			this.resetVisual()
			return
		}

		const idx = getRouteIndex(this.currentPath)
		if (idx === -1) {
			this.resetVisual()
			return
		}

		let target: RouteId | null = null

		if (dx > 0 && idx > 0) {
			target = NAV_ROUTES[idx - 1]
		} else if (dx < 0 && idx < NAV_ROUTES.length - 1) {
			target = NAV_ROUTES[idx + 1]
		}

		if (target) {
			this.navigating = true
			this.platform?.haptic.impact('light')

			// quick reset before navigation
			if (this.contentEl) {
				this.contentEl.style.transition = 'transform 80ms ease-out, opacity 80ms ease-out'
				this.contentEl.style.transform = ''
				this.contentEl.style.opacity = ''
			}

			goto(resolve(target))
		} else {
			this.resetVisual()
		}
	}

	private resetVisual() {
		if (this.contentEl) {
			this.contentEl.style.transition = 'transform 150ms ease-out, opacity 150ms ease-out'
			this.contentEl.style.transform = ''
			this.contentEl.style.opacity = ''
		}
	}
}

export const swipeController = new SwipeController()
