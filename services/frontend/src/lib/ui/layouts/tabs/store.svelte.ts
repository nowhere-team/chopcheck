import { replaceState } from '$app/navigation'
import { resolve } from '$app/paths'
import { NAV_ROUTES, type NavRoute } from '$lib/navigation/routes'

class TabsStore {
	index = $state(this.getInitialIndex())
	scrollProgress = $state(0)

	private _emblaApi: any = null

	private getInitialIndex(): number {
		if (typeof window === 'undefined') return 0
		const path = window.location.pathname
		const idx = NAV_ROUTES.indexOf(path as NavRoute)
		return idx !== -1 ? idx : 0
	}

	get currentRoute(): NavRoute {
		return NAV_ROUTES[this.index] ?? '/'
	}

	setEmblaApi(api: any) {
		this._emblaApi = api
	}

	goToIndex(idx: number, instant = false) {
		if (this._emblaApi && idx >= 0 && idx < NAV_ROUTES.length) {
			this._emblaApi.scrollTo(idx, instant)
		}
	}

	goToRoute(route: NavRoute, instant = false) {
		const idx = NAV_ROUTES.indexOf(route)
		if (idx !== -1) {
			this.goToIndex(idx, instant)
		}
	}

	handlePopState() {
		const path = window.location.pathname
		const idx = NAV_ROUTES.indexOf(path as NavRoute)
		if (idx !== -1 && idx !== this.index) {
			this.index = idx
			this._emblaApi?.scrollTo(idx, true)
		}
	}

	updateIndex(idx: number) {
		this.index = idx
	}

	updateScrollProgress(progress: number) {
		this.scrollProgress = progress
	}

	syncUrl(idx: number) {
		const route = NAV_ROUTES[idx]
		if (route && window.location.pathname !== route) {
			// use sveltekit's replaceState to keep router in sync
			replaceState(resolve(route), {})
		}
	}
}

export const tabsStore = new TabsStore()
