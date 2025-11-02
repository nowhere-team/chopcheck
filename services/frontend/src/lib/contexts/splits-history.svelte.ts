import { getContext, setContext } from 'svelte'

import { getEarlierSplits, getMySplitsGrouped } from '$api/splits'
import type { Split } from '$api/types'

const SPLITS_HISTORY_KEY = Symbol('splits-history')

interface SplitsHistoryContext {
	thisWeek: Split[]
	thisMonth: Split[]
	earlier: Split[]
	isLoading: boolean
	isLoadingMore: boolean
	hasMore: boolean
	error: string | null
	fetch: (force?: boolean) => Promise<void>
	loadMore: () => Promise<void>
	invalidate: () => void
}

export function setSplitsHistoryContext() {
	let thisWeek = $state<Split[]>([])
	let thisMonth = $state<Split[]>([])
	let earlier = $state<Split[]>([])
	let isLoading = $state(false)
	let isLoadingMore = $state(false)
	let hasMore = $state(true)
	let error = $state<string | null>(null)
	let offset = 0
	const limit = 20

	const fetch = async (force = false) => {
		if (!force && (thisWeek.length > 0 || thisMonth.length > 0 || earlier.length > 0)) {
			return
		}

		isLoading = true
		error = null
		offset = 0

		try {
			const data = await getMySplitsGrouped()
			thisWeek = data.thisWeek
			thisMonth = data.thisMonth
			earlier = data.earlier
			hasMore = earlier.length === 20
			offset = 20
		} catch (err) {
			error = err instanceof Error ? err.message : 'не удалось загрузить сплиты'
			console.error('failed to fetch splits:', err)
		} finally {
			isLoading = false
		}
	}

	const loadMore = async () => {
		if (!hasMore || isLoadingMore) return

		isLoadingMore = true

		try {
			const response = await getEarlierSplits({ offset, limit })
			earlier = [...earlier, ...response.splits]
			hasMore = response.pagination.hasMore
			offset += limit
		} catch (err) {
			console.error('failed to load more splits:', err)
		} finally {
			isLoadingMore = false
		}
	}

	const invalidate = () => {
		thisWeek = []
		thisMonth = []
		earlier = []
		offset = 0
		hasMore = true
	}

	const context: SplitsHistoryContext = {
		get thisWeek() {
			return thisWeek
		},
		get thisMonth() {
			return thisMonth
		},
		get earlier() {
			return earlier
		},
		get isLoading() {
			return isLoading
		},
		get isLoadingMore() {
			return isLoadingMore
		},
		get hasMore() {
			return hasMore
		},
		get error() {
			return error
		},
		fetch,
		loadMore,
		invalidate
	}

	setContext(SPLITS_HISTORY_KEY, context)
	return context
}

export function getSplitsHistoryContext() {
	const context = getContext<SplitsHistoryContext>(SPLITS_HISTORY_KEY)
	if (!context) {
		throw new Error('splits history context not found')
	}
	return context
}
