import { isTMA } from '@tma.js/sdk'

export type EnvironmentType = 'telegram-mini-app' | 'web'

export function detectEnvironment(): EnvironmentType {
	if (isTMA()) {
		return 'telegram-mini-app'
	}
	return 'web'
}
