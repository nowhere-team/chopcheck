// centralized theme application for all platforms

export interface ThemeColors {
	bg: string
	bgSecondary: string
	bgTertiary: string
	bgElevated: string
	bgSelected: string
	text: string
	textSecondary: string
	textTertiary: string
	textMuted: string
	border: string
	borderSubtle: string
	primary: string
	primaryText: string
	accent: string
	icon: string
	iconActive: string
	iconMuted: string
}

const LIGHT_THEME: ThemeColors = {
	bg: '#ffffff',
	bgSecondary: '#f8fafc',
	bgTertiary: '#f1f5f9',
	bgElevated: '#ffffff',
	bgSelected: '#f1f5f9',
	text: '#0f172a',
	textSecondary: '#475569',
	textTertiary: '#64748b',
	textMuted: '#94a3b8',
	border: '#e2e8f0',
	borderSubtle: '#f1f5f9',
	primary: '#0f172a',
	primaryText: '#ffffff',
	accent: '#3b82f6',
	icon: '#64748b',
	iconActive: '#0f172a',
	iconMuted: '#94a3b8'
}

const DARK_THEME: ThemeColors = {
	bg: '#0f172a',
	bgSecondary: '#1e293b',
	bgTertiary: '#334155',
	bgElevated: '#1e293b',
	bgSelected: '#334155',
	text: '#f8fafc',
	textSecondary: '#cbd5e1',
	textTertiary: '#94a3b8',
	textMuted: '#64748b',
	border: '#334155',
	borderSubtle: '#1e293b',
	primary: '#f8fafc',
	primaryText: '#0f172a',
	accent: '#60a5fa',
	icon: '#94a3b8',
	iconActive: '#f8fafc',
	iconMuted: '#64748b'
}

export function applyThemeColors(colors: Partial<ThemeColors>, isDark: boolean): void {
	const base = isDark ? DARK_THEME : LIGHT_THEME
	const merged = { ...base, ...colors }
	const root = document.documentElement

	root.style.setProperty('--color-bg', merged.bg)
	root.style.setProperty('--color-bg-secondary', merged.bgSecondary)
	root.style.setProperty('--color-bg-tertiary', merged.bgTertiary)
	root.style.setProperty('--color-bg-elevated', merged.bgElevated)
	root.style.setProperty('--color-bg-selected', merged.bgSelected)
	root.style.setProperty('--color-text', merged.text)
	root.style.setProperty('--color-text-secondary', merged.textSecondary)
	root.style.setProperty('--color-text-tertiary', merged.textTertiary)
	root.style.setProperty('--color-text-muted', merged.textMuted)
	root.style.setProperty('--color-border', merged.border)
	root.style.setProperty('--color-border-subtle', merged.borderSubtle)
	root.style.setProperty('--color-primary', merged.primary)
	root.style.setProperty('--color-primary-text', merged.primaryText)
	root.style.setProperty('--color-accent', merged.accent)
	root.style.setProperty('--color-icon', merged.icon)
	root.style.setProperty('--color-icon-active', merged.iconActive)
	root.style.setProperty('--color-icon-muted', merged.iconMuted)

	root.dataset.theme = isDark ? 'dark' : 'light'
}

export function applySafeArea(insets: {
	top: number
	bottom: number
	left: number
	right: number
}): void {
	const root = document.documentElement
	root.style.setProperty('--safe-top', `${insets.top}px`)
	root.style.setProperty('--safe-bottom', `${insets.bottom}px`)
	root.style.setProperty('--safe-left', `${insets.left}px`)
	root.style.setProperty('--safe-right', `${insets.right}px`)
}

export function calculateIsDark(bgColor: string): boolean {
	const hex = bgColor.replace('#', '')
	const r = parseInt(hex.slice(0, 2), 16)
	const g = parseInt(hex.slice(2, 4), 16)
	const b = parseInt(hex.slice(4, 6), 16)
	const brightness = (r * 299 + g * 587 + b * 114) / 1000
	return brightness < 128
}
