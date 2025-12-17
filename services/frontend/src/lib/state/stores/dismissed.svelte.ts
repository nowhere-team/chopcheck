import { PersistedState } from 'runed'

interface DismissedData {
	// global warnings per split: { splitId: ['code1', 'code2'] }
	global: Record<string, string[]>
	// item warnings: { splitId: { itemId: ['code1', 'code2'] } }
	items: Record<string, Record<string, string[]>>
}

const dismissed = new PersistedState<DismissedData>('chopcheck:dismissed-warnings', {
	global: {},
	items: {}
})

export function isWarningDismissed(splitId: string, code: string, itemId?: string): boolean {
	if (itemId) {
		return dismissed.current.items[splitId]?.[itemId]?.includes(code) ?? false
	}
	return dismissed.current.global[splitId]?.includes(code) ?? false
}

export function dismissWarning(splitId: string, code: string, itemId?: string): void {
	const data = dismissed.current

	if (itemId) {
		const splitItems = data.items[splitId] ?? {}
		const itemCodes = splitItems[itemId] ?? []
		if (!itemCodes.includes(code)) {
			dismissed.current = {
				...data,
				items: {
					...data.items,
					[splitId]: {
						...splitItems,
						[itemId]: [...itemCodes, code]
					}
				}
			}
		}
	} else {
		const splitCodes = data.global[splitId] ?? []
		if (!splitCodes.includes(code)) {
			dismissed.current = {
				...data,
				global: {
					...data.global,
					[splitId]: [...splitCodes, code]
				}
			}
		}
	}
}

export function restoreWarning(splitId: string, code: string, itemId?: string): void {
	const data = dismissed.current

	if (itemId) {
		const splitItems = data.items[splitId]
		const itemCodes = splitItems?.[itemId]
		if (itemCodes) {
			dismissed.current = {
				...data,
				items: {
					...data.items,
					[splitId]: {
						...splitItems,
						[itemId]: itemCodes.filter(c => c !== code)
					}
				}
			}
		}
	} else {
		const splitCodes = data.global[splitId]
		if (splitCodes) {
			dismissed.current = {
				...data,
				global: {
					...data.global,
					[splitId]: splitCodes.filter(c => c !== code)
				}
			}
		}
	}
}

export function clearDismissedForSplit(splitId: string): void {
	const data = dismissed.current
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { [splitId]: _g, ...restGlobal } = data.global
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { [splitId]: _i, ...restItems } = data.items
	dismissed.current = {
		global: restGlobal,
		items: restItems
	}
}

// reactive getter for use in components
export function getDismissedCodes(splitId: string, itemId?: string): string[] {
	if (itemId) {
		return dismissed.current.items[splitId]?.[itemId] ?? []
	}
	return dismissed.current.global[splitId] ?? []
}
