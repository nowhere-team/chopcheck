import { getContext, setContext } from 'svelte'

import { getMyStats } from '$api/auth'
import type { UserStats } from '$api/types'

const STATS_KEY = Symbol('stats')
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface StatsContext {
	data: UserStats | null
	isLoading: boolean
	error: string | null
	lastFetchedAt: number | null
	fetch: (force?: boolean) => Promise<void>
	invalidate: () => void
}

export function setStatsContext() {
	let data = $state<UserStats | null>(null)
	let isLoading = $state(false)
	let error = $state<string | null>(null)
	let lastFetchedAt = $state<number | null>(null)

	const shouldRefetch = () => {
		if (!lastFetchedAt) return true
		return Date.now() - lastFetchedAt > CACHE_TTL
	}

	const fetch = async (force = false) => {
		if (!force && data && !shouldRefetch()) {
			return
		}

		isLoading = true
		error = null

		try {
			data = await getMyStats()
			lastFetchedAt = Date.now()
		} catch (err) {
			error = err instanceof Error ? err.message : 'unknown error'
			console.error('failed to fetch stats:', err)
		} finally {
			isLoading = false
		}
	}

	const invalidate = () => {
		lastFetchedAt = null
	}

	const context: StatsContext = {
		get data() {
			return data
		},
		get isLoading() {
			return isLoading
		},
		get error() {
			return error
		},
		get lastFetchedAt() {
			return lastFetchedAt
		},
		fetch,
		invalidate
	}

	setContext(STATS_KEY, context)
	return context
}

export function getStatsContext() {
	const context = getContext<StatsContext>(STATS_KEY)
	if (!context) {
		throw new Error('stats context not found')
	}
	return context
}
