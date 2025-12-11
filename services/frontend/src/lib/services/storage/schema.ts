import { z } from 'zod'

export const UserPreferencesSchema = z.object({
	theme: z.enum(['light', 'dark', 'auto']).default('auto'),
	notifications: z.boolean().default(true),
	language: z.string().default('ru')
})

export const ConsentsSchema = z.object({
	terms: z.boolean().default(false),
	privacy: z.boolean().default(false),
	acceptedAt: z.string().optional()
})

export const SplitDraftSchema = z.object({
	name: z.string(),
	icon: z.string().default('🍔'),
	currency: z.string().default('RUB'),
	items: z
		.array(
			z.object({
				name: z.string(),
				price: z.number(),
				quantity: z.string()
			})
		)
		.default([]),
	updatedAt: z.string()
})

// registry of all typed storage keys
export const STORAGE_SCHEMAS = {
	user_preferences: UserPreferencesSchema,
	consents: ConsentsSchema,
	split_draft: SplitDraftSchema
} as const

export type StorageSchemas = typeof STORAGE_SCHEMAS
export type StorageKey = keyof StorageSchemas
export type StorageValue<K extends StorageKey> = z.infer<StorageSchemas[K]>
