import { getContext, setContext } from 'svelte'

import type { Platform } from '$lib/platform/types'

import { type App, app } from './state.svelte'

const PLATFORM_KEY = Symbol('platform')
const APP_KEY = Symbol('app')

export function setPlatformContext(platform: Platform): void {
	setContext(PLATFORM_KEY, platform)
	setContext(APP_KEY, app)
}

export function getPlatform(): Platform {
	const platform = getContext<Platform>(PLATFORM_KEY)
	if (!platform) {
		throw new Error('platform not found in context. ensure AppProvider is mounted.')
	}
	return platform
}

export function getApp(): App {
	const appInstance = getContext<App>(APP_KEY)
	if (!appInstance) {
		throw new Error('app not found in context. ensure AppProvider is mounted.')
	}
	return appInstance
}

// convenience exports
export { app } from './state.svelte'
