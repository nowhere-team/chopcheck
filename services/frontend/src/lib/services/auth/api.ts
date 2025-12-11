import type { PlatformAuthPayload } from '$lib/platform/types'
import { api } from '$lib/services/api/client'
import { createLogger } from '$lib/shared/logger'

import type { AuthResponse, User } from './types'

const log = createLogger('auth-api')

// backend response types (snake_case as received from api)
interface BackendUser {
	id: string
	username?: string
	display_name: string
	avatar_url?: string
	telegram_id?: number
}

interface BackendAuthResponse {
	access_token: string
	user: BackendUser
}

// transform backend response to frontend format
function toUser(backend: BackendUser): User {
	return {
		id: backend.id,
		displayName: backend.display_name,
		username: backend.username,
		avatarUrl: backend.avatar_url,
		telegramId: backend.telegram_id
	}
}

function toAuthResponse(backend: BackendAuthResponse): AuthResponse {
	return {
		user: toUser(backend.user),
		tokens: { accessToken: backend.access_token }
	}
}

export async function authenticate(payload: PlatformAuthPayload): Promise<AuthResponse> {
	log.debug('authenticating', { platform: payload.platform })

	// parse payload data to determine auth type
	const data = JSON.parse(payload.data) as {
		telegram_id?: number
		first_name?: string
		username?: string
		last_name?: string
		photo_url?: string
		auth_date?: string
		hash?: string
	}

	// use dev endpoint if telegram auth data is present
	// this allows quick auth without full telegram validation in dev
	if (data.telegram_id && data.first_name) {
		log.debug('using telegram auth', { telegramId: data.telegram_id })

		const response = await api.post<BackendAuthResponse>(
			'dev/telegram',
			{
				telegram_id: data.telegram_id,
				username: data.username,
				first_name: data.first_name,
				last_name: data.last_name,
				photo_url: data.photo_url
			},
			{ skipAuth: true }
		)

		await api.setToken(response.access_token)
		log.info('authenticated successfully', { userId: response.user.id })

		return toAuthResponse(response)
	}

	// fallback to standard auth endpoint
	log.debug('using standard auth endpoint')
	const response = await api.post<BackendAuthResponse>('auth/login', payload, { skipAuth: true })
	await api.setToken(response.access_token)

	return toAuthResponse(response)
}

export async function getMe(): Promise<User> {
	log.debug('fetching current user')
	const backend = await api.get<BackendUser>('auth/me')
	return toUser(backend)
}

export async function logout(): Promise<void> {
	log.debug('logging out')
	try {
		await api.post('auth/logout')
	} finally {
		await api.clearToken()
	}
}

export async function refreshToken(): Promise<AuthResponse> {
	log.debug('refreshing token')
	const response = await api.post<BackendAuthResponse>('auth/refresh')
	await api.setToken(response.access_token)
	return toAuthResponse(response)
}
