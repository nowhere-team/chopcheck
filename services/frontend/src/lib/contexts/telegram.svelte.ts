import { getContext, setContext } from 'svelte'

import type { TelegramData } from '$telegram/sdk'

const TELEGRAM_KEY = Symbol('telegram')

interface TelegramContext {
	data: TelegramData | null
}

export function setTelegramContext() {
	const telegram = $state<TelegramContext>({ data: null })
	setContext(TELEGRAM_KEY, telegram)
	return telegram
}

export function getTelegramContext() {
	const telegram = getContext<TelegramContext>(TELEGRAM_KEY)
	if (!telegram) {
		throw new Error('telegram context not found')
	}
	return telegram
}
