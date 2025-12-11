import type { SkinTone } from './types'

const SKIN_TONE_MODIFIERS: Record<string, string> = {
	light: '1f3fb',
	'medium-light': '1f3fc',
	medium: '1f3fd',
	'medium-dark': '1f3fe',
	dark: '1f3ff'
}

const SKIN_TONE_CODEPOINTS = new Set(Object.values(SKIN_TONE_MODIFIERS))

export function emojiToUnicode(emoji: string): string {
	const codePoints: string[] = []

	for (const char of emoji) {
		const cp = char.codePointAt(0)
		if (cp !== undefined && cp !== 0xfe0f) {
			codePoints.push(cp.toString(16).toLowerCase())
		}
	}

	return codePoints.join('-')
}

export function extractBaseAndSkinTone(unicode: string): { base: string; skinTone: SkinTone } {
	const parts = unicode.split('-')

	const skinTonePart = parts.find(p => SKIN_TONE_CODEPOINTS.has(p))

	if (skinTonePart) {
		const base = parts.filter(p => !SKIN_TONE_CODEPOINTS.has(p)).join('-')
		const skinTone = Object.entries(SKIN_TONE_MODIFIERS).find(
			([, v]) => v === skinTonePart
		)?.[0] as SkinTone

		return { base, skinTone }
	}

	return { base: unicode, skinTone: null }
}

export function buildUnicodeWithSkinTone(base: string, skinTone: SkinTone): string {
	if (!skinTone) return base

	const modifier = SKIN_TONE_MODIFIERS[skinTone]
	if (!modifier) return base

	return `${base}-${modifier}`
}

export function getSkinToneModifier(skinTone: SkinTone): string | null {
	if (!skinTone) return null
	return SKIN_TONE_MODIFIERS[skinTone] || null
}
