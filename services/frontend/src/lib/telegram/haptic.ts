import { hapticFeedback } from '@telegram-apps/sdk'

type ImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
type NotificationType = 'error' | 'success' | 'warning'

export function impactOccurred(style: ImpactStyle = 'medium') {
	if (hapticFeedback.isSupported()) {
		hapticFeedback.impactOccurred(style)
	}
}

export function notificationOccurred(type: NotificationType) {
	if (hapticFeedback.isSupported()) {
		hapticFeedback.notificationOccurred(type)
	}
}

export function selectionChanged() {
	if (hapticFeedback.isSupported()) {
		hapticFeedback.selectionChanged()
	}
}

// aliases for convenience
export const haptic = {
	light: () => impactOccurred('light'),
	medium: () => impactOccurred('medium'),
	heavy: () => impactOccurred('heavy'),
	soft: () => impactOccurred('soft'),
	rigid: () => impactOccurred('rigid'),
	success: () => notificationOccurred('success'),
	error: () => notificationOccurred('error'),
	warning: () => notificationOccurred('warning'),
	selection: () => selectionChanged()
}
