export function formatPrice(kopecks: number, currency = 'RUB'): string {
	const rubles = kopecks / 100
	return rubles.toLocaleString('ru-RU', {
		style: 'currency',
		currency: currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
	})
}

export function parsePriceInput(value: string): number {
	// replace comma with dot, remove non-numeric chars except dot
	const normalized = value.replace(',', '.').replace(/[^\d.]/g, '')
	// prevent multiple dots
	const parts = normalized.split('.')
	const clean = parts[0] + (parts.length > 1 ? '.' + parts[1] : '')

	const rubles = parseFloat(clean) || 0
	return Math.round(rubles * 100)
}

export function formatPriceInput(kopecks: number): string {
	if (kopecks === 0) return ''
	const rubles = kopecks / 100
	// toFixed(2) is good, but user might want to edit integer part
	return rubles.toString().replace('.', ',')
}
