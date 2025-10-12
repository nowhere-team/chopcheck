import type { SafeAreaInsets } from '@telegram-apps/bridge'

import type { TelegramTheme } from '$telegram/types'

const MAP: [keyof TelegramTheme, string][] = [
	['bgColor', '--tg-bg'],
	['textColor', '--tg-text'],
	['hintColor', '--tg-hint'],
	['buttonColor', '--tg-button'],
	['buttonTextColor', '--tg-button-text'],
	['secondaryBgColor', '--tg-secondary-bg'],
	['sectionBgColor', '--tg-section-bg'],
	['subtitleTextColor', '--tg-subtitle']
]

export function bindTheme(theme: TelegramTheme, insets: SafeAreaInsets) {
	setTelegramVars(theme)
	setInsets(insets)
}

export function getCurrentTheme() {
	const { theme } = document.documentElement.dataset
	return theme ? (theme as 'telegram' | 'chopcheck') : 'chopcheck'
}

export function enableTelegramTheme() {
	document.documentElement.dataset.theme = 'telegram'
}

export function enableChopcheckTheme() {
	document.documentElement.dataset.theme = 'chopcheck'
}

function setTelegramVars(theme: TelegramTheme) {
	const root = document.documentElement.style
	MAP.forEach(([key, cssVar]) => {
		const value = theme[key]
		if (value) root.setProperty(cssVar, value)
	})
}

function setInsets(insets: { top: number; bottom: number; left: number; right: number }) {
	const { style } = document.documentElement
	style.setProperty('--tg-inset-top', `${insets.top}px`)
	style.setProperty('--tg-inset-bottom', `${insets.bottom}px`)
	style.setProperty('--tg-inset-left', `${insets.left}px`)
	style.setProperty('--tg-inset-right', `${insets.right}px`)
}
