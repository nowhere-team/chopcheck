export const APP_NAME = 'chopcheck'
export const APP_VERSION = '1.0.0'

export const STORAGE_KEYS = {
	AUTH_TOKEN: 'auth_token',
	USER_PREFERENCES: 'user_preferences',
	CONSENTS: 'consents',
	SPLIT_DRAFT: 'split_draft'
} as const

export const API_BASE_URL = import.meta.env.DEV
	? '/api'
	: import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export const API_TIMEOUT = 15000

export const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'chopcheck_bot'
