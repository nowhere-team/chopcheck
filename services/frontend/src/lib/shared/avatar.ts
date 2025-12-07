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

export function getAvatarColor(id: string): string {
	let hash = 0
	for (let i = 0; i < id.length; i++) {
		hash = id.charCodeAt(i) + ((hash << 5) - hash)
	}
	return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] as string
}

export function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/)
	if (parts.length >= 2 && parts[0] && parts[1]) {
		return (parts[0][0] + parts[1][0]).toUpperCase()
	}
	return name.slice(0, 2).toUpperCase()
}
