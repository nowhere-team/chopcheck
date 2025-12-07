import type { SafeArea, ThemePalette } from './types'

// converts palette to CSS variables
export function applyThemePalette(palette: ThemePalette): void {
	const root = document.documentElement.style

	// Apply core keys dynamically
	Object.entries(palette).forEach(([key, value]) => {
		// converts "bgSecondary" -> "--color-bg-secondary"
		const cssVar = `--color-${camelToKebab(key)}`
		root.setProperty(cssVar, value)
	})

	// helper to force specific derived colors if needed (optional)
	// root.setProperty('--glass-bg', `${palette.bgSecondary}E6`) // 90% opacity
}

export function applySafeArea(insets: SafeArea): void {
	const root = document.documentElement.style
	root.setProperty('--safe-top', `${insets.top}px`)
	root.setProperty('--safe-bottom', `${insets.bottom}px`)
	root.setProperty('--safe-left', `${insets.left}px`)
	root.setProperty('--safe-right', `${insets.right}px`)
}

// Utils
function camelToKebab(str: string): string {
	return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
}
