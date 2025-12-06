import { isTMA } from '@tma.js/sdk'

import { TelegramPlatform } from './telegram/adapter'
import type { Platform } from './types'
import { DevWebPlatform, WebPlatform } from './web/adapter'

export function createPlatform(): Platform {
	// dev mode: check if we should use dev platform with fake user
	const isDev = import.meta.env.DEV
	const useDevUser = import.meta.env.VITE_DEV_USER_ID

	if (typeof window === 'undefined') {
		return new WebPlatform()
	}

	if (isTMA()) {
		return new TelegramPlatform()
	}

	if (isDev && useDevUser) {
		return new DevWebPlatform()
	}

	return new WebPlatform()
}
