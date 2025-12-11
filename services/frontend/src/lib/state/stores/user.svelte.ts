import { api } from '$lib/services/api/client'
import type { User, UserStats } from '$lib/services/api/types'

import { cache } from '../cache.svelte'
import { createQuery } from '../query.svelte'

const CACHE_KEYS = {
	me: 'user:me',
	stats: 'user:stats'
}

// backend returns snake_case, we transform to camelCase
interface BackendUser {
	id: string
	username?: string
	display_name: string
	avatar_url?: string
	telegram_id?: number
}

interface BackendStats {
	totalJoinedSplits: number
	monthlySpent: number
}

function transformUser(backend: BackendUser): User {
	return {
		id: backend.id,
		displayName: backend.display_name,
		username: backend.username,
		avatarUrl: backend.avatar_url,
		telegramId: backend.telegram_id
	}
}

export function createUserStore() {
	const meQuery = createQuery<User>(
		CACHE_KEYS.me,
		async () => {
			const data = await api.get<BackendUser>('auth/me')
			return transformUser(data)
		},
		{ ttl: 10 * 60 * 1000, refetchOnMount: false }
	)

	const statsQuery = createQuery<UserStats>(
		CACHE_KEYS.stats,
		() => api.get<BackendStats>('auth/me/stats'),
		{ ttl: 5 * 60 * 1000 }
	)

	function invalidateAll(): void {
		cache.invalidatePattern('user:*')
	}

	return {
		me: meQuery,
		stats: statsQuery,
		invalidateAll
	}
}

// singleton
let userStore: ReturnType<typeof createUserStore> | null = null

export function getUserStore() {
	if (!userStore) {
		userStore = createUserStore()
	}
	return userStore
}
