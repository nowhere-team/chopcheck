import { isTMA, retrieveLaunchParams } from '@telegram-apps/bridge'
import { init as sdkInit, requestFullscreen, viewport } from '@telegram-apps/sdk'

import { bindTheme, enableTelegramTheme } from '$telegram/theme'
import type { TelegramAuth } from '$telegram/types'

export type TelegramData = Awaited<ReturnType<typeof sdk>>

let initPromise: Promise<TelegramData> | null = null
let cachedResult: TelegramData | null = null

export async function init() {
	if (cachedResult) return cachedResult
	if (initPromise) return initPromise

	if (!isTMA()) {
		throw new Error('not telegram app')
	}

	initPromise = sdk().then(result => {
		cachedResult = result
		initPromise = null
		return result
	})

	return initPromise
}

async function sdk() {
	sdkInit()

	const {
		tgWebAppData: auth,
		tgWebAppPlatform: platform,
		tgWebAppThemeParams: theme
	} = retrieveLaunchParams(true)

	await viewport.mount({ timeout: 500 })
	if (isMobile(platform) && requestFullscreen.isAvailable()) {
		await requestFullscreen()
	}

	const insets = viewport.safeAreaInsets()
	bindTheme(theme, insets)
	enableTelegramTheme()

	return {
		viewport,
		platform,
		theme,
		insets,
		auth: auth as unknown as TelegramAuth
	}
}

export function isMobile(platform: string) {
	return platform === 'ios' || platform === 'android'
}
