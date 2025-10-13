import { getContext, setContext } from 'svelte'

const SWIPE_KEY = Symbol('swipe')

interface SwipeContext {
	enabled: boolean
}

export function setSwipeContext(enabled = true) {
	const swipe = $state<SwipeContext>({ enabled })
	setContext(SWIPE_KEY, swipe)
	return swipe
}

export function getSwipeContext() {
	return getContext<SwipeContext>(SWIPE_KEY)
}
