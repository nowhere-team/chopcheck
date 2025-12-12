export function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

export function formatDate(dateString: string): string {
	const date = new Date(dateString)
	const now = new Date()

	if (date.toDateString() === now.toDateString()) {
		return date.toLocaleTimeString('ru-RU', {
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	if (date.getFullYear() === now.getFullYear()) {
		return date.toLocaleDateString('ru-RU', {
			day: 'numeric',
			month: 'short'
		})
	}

	return date.toLocaleDateString('ru-RU', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	})
}
