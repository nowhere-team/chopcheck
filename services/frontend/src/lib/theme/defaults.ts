import type { ThemePalette } from './types'

// default "chopcheck" web theme
export const DEFAULT_THEME: ThemePalette = {
	bg: '#ffffff',
	bgSecondary: '#f1f5f9',
	bgTertiary: '#e2e8f0',
	text: '#0f172a',
	textSecondary: '#475569',
	textTertiary: '#94a3b8',
	primary: '#3b82f6',
	primaryText: '#ffffff',
	error: '#ef4444',
	success: '#10b981'
}

// dark mode defaults
export const DARK_THEME: ThemePalette = {
	bg: '#0f172a',
	bgSecondary: '#1e293b',
	bgTertiary: '#334155',
	text: '#f8fafc',
	textSecondary: '#cbd5e1',
	textTertiary: '#64748b',
	primary: '#60a5fa',
	primaryText: '#0f172a',
	error: '#f87171',
	success: '#34d399'
}
