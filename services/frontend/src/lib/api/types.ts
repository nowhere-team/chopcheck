export interface User {
	id: string
	username?: string
	displayName: string
	avatarUrl?: string
	telegramId?: number
}

export interface AuthResponse {
	accessToken: string
	user: {
		id: string
		displayName: string
		username?: string
		avatarUrl?: string
	}
}

export interface Split {
	id: string
	name: string
	currency: string
	status: 'draft' | 'active' | 'completed'
	phase: 'setup' | 'voting' | 'payment' | 'confirming'
	createdAt: string
	updatedAt: string
}

export interface MySplitsResponse {
	splits: Split[]
}
