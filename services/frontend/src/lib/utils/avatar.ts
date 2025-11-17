const AVATAR_COLORS = [
	'#ef4444',
	'#f97316',
	'#f59e0b',
	'#10b981',
	'#06b6d4',
	'#3b82f6',
	'#8b5cf6',
	'#ec4899'
]

export function getAvatarColor(userId: string): string {
	let hash = 0
	for (let i = 0; i < userId.length; i++) {
		hash = userId.charCodeAt(i) + ((hash << 5) - hash)
	}
	const index = Math.abs(hash) % AVATAR_COLORS.length
	return AVATAR_COLORS[index]!
}

export function getInitials(displayName: string): string {
	const parts = displayName.trim().split(/\s+/)
	if (parts.length >= 2 && parts[0] && parts[1]) {
		return (parts[0][0] + parts[1][0]).toUpperCase()
	}
	return displayName.slice(0, 2).toUpperCase()
}
