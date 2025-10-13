export const CAROUSEL_ROUTES = ['/', '/history', '/split/create', '/contacts', '/profile'] as const

export type CarouselRoute = (typeof CAROUSEL_ROUTES)[number]

export function getNavigationDirection(from: string, to: string): 'forward' | 'backward' | 'none' {
	const fromIndex = CAROUSEL_ROUTES.indexOf(from as CarouselRoute)
	const toIndex = CAROUSEL_ROUTES.indexOf(to as CarouselRoute)

	if (fromIndex === -1 || toIndex === -1) return 'none'
	if (toIndex > fromIndex) return 'forward'
	if (toIndex < fromIndex) return 'backward'
	return 'none'
}
