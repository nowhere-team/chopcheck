export function formatPrice(kopecks: number): string {
	const rubles = kopecks / 100
	return rubles.toLocaleString('ru-RU', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})
}

export function parsePrice(value: string): number {
	const normalized = value.replace(',', '.')
	const rubles = parseFloat(normalized) || 0
	return Math.round(rubles * 100)
}

export function formatPriceInput(kopecks: number): string {
	const rubles = kopecks / 100
	return rubles.toFixed(2).replace('.', ',')
}
