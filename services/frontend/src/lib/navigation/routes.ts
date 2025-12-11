export const NAV_ROUTES = ['/', '/history', '/splits/create', '/contacts', '/profile'] as const
export type NavRoute = (typeof NAV_ROUTES)[number]

export function getRouteIndex(path: string): number {
	return NAV_ROUTES.indexOf(path as NavRoute)
}

export function isNavRoute(path: string): path is NavRoute {
	return NAV_ROUTES.includes(path as NavRoute)
}

export function getNavigationDirection(from: string, to: string): 'forward' | 'backward' | 'none' {
	const fromIndex = getRouteIndex(from)
	const toIndex = getRouteIndex(to)

	if (fromIndex === -1 || toIndex === -1) return 'none'
	if (toIndex > fromIndex) return 'forward'
	if (toIndex < fromIndex) return 'backward'
	return 'none'
}
