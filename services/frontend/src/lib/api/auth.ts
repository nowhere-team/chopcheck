import { api } from '$api/client'
import { saveToken } from '$api/tokens'
import type { AuthResponse, User } from '$api/types'

export async function authenticateWithTelegram(initData: string): Promise<AuthResponse> {
	const response = await api.post<AuthResponse>('auth/telegram', { initData })
	await saveToken(response.accessToken)
	return response
}

export async function getMe(): Promise<User> {
	return await api.get<User>('auth/me')
}
