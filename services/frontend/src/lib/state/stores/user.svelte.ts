import { resource } from 'runed'

import { api } from '$lib/services/api/client'
import type { User } from '$lib/services/api/types'

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

export class UserService {
	me = resource(
		() => 'me',
		async () => {
			const data = await api.get<BackendUser>('auth/me')
			return transformUser(data)
		}
	)

	stats = resource(
		() => 'stats',
		async () => {
			return api.get<BackendStats>('auth/me/stats')
		}
	)

	async refresh() {
		await Promise.all([this.me.refetch(), this.stats.refetch()])
	}
}
