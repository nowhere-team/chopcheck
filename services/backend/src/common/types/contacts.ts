export interface Contact {
	userId: string
	displayName: string
	username?: string
	avatarUrl?: string
	isDeleted: boolean
	totalSplits: number
	lastInteraction: Date
	firstInteraction: Date
	metadata?: {
		totalOwed?: number
		totalOwing?: number
	}
}

export interface ContactsFilter {
	query?: string
	limit?: number
	offset?: number
	sortBy?: 'recent' | 'frequent' | 'name'
}
