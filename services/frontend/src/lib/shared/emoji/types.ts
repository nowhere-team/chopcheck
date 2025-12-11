export interface EmojiEntry {
	unicode: string
	cldr: string
	keywords: string[]
	hasSkinTones: boolean
	skinTones?: string[]
}

export type EmojiMap = Record<string, EmojiEntry>

export type EmojiVariant = '3d' | 'flat'

export type SkinTone = 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark' | null
