export interface User {
	id: string
	displayName: string
	username?: string
	avatarUrl?: string
	telegramId?: number
}

export interface AuthTokens {
	accessToken: string
	refreshToken?: string
}

export interface AuthResponse {
	user: User
	tokens: AuthTokens
}
