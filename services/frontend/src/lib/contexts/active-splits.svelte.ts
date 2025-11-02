import { getContext, setContext } from 'svelte'

import { getMySplits } from '$api/splits'
import type { Split } from '$api/types'

const ACTIVE_SPLITS_KEY = Symbol('active-splits')

interface ActiveSplitsContext {
	splits: Split[]
	isLoading: boolean
	error: string | null
	fetch: (force?: boolean) => Promise<void>
	invalidate: () => void
}

export function setActiveSplitsContext() {
	let splits = $state<Split[]>([])
	let isLoading = $state(false)
	let error = $state<string | null>(null)
	let fetched = false

	const fetch = async (force = false) => {
		if (!force && fetched) return

		isLoading = true
		error = null

		try {
			const response = await getMySplits({ status: 'active', limit: 10 })
			splits = response.splits
			fetched = true
		} catch (err) {
			error = err instanceof Error ? err.message : 'Не удалось загрузить активные сплиты'
			console.error('failed to fetch active splits:', err)
		} finally {
			isLoading = false
		}
	}

	const invalidate = () => {
		fetched = false
	}

	const context: ActiveSplitsContext = {
		get splits() {
			return splits
		},
		get isLoading() {
			return isLoading
		},
		get error() {
			return error
		},
		fetch,
		invalidate
	}

	setContext(ACTIVE_SPLITS_KEY, context)
	return context
}

export function getActiveSplitsContext() {
	const context = getContext<ActiveSplitsContext>(ACTIVE_SPLITS_KEY)
	if (!context) {
		throw new Error('active splits context not found')
	}
	return context
}
