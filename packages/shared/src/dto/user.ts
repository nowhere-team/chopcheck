import { z } from 'zod'
import { dateSchema, uuidSchema } from '../common'

export const userPublicSchema = z.object({
	id: uuidSchema,
	displayName: z.string(),
	username: z.string().nullable().optional(),
	avatarUrl: z.string().nullable().optional(),
	telegramId: z.number().nullable().optional(),
})

// Full profile for /me
export const userPrivateSchema = userPublicSchema.extend({
	preferences: z.record(z.string(), z.unknown()),
	createdAt: dateSchema,
})

export const updatePreferencesSchema = z.object({
	preferences: z.record(z.string(), z.unknown())
})

export type UserDto = z.infer<typeof userPublicSchema>
export type UserMeDto = z.infer<typeof userPrivateSchema>
export type UpdatePreferencesDto = z.infer<typeof updatePreferencesSchema>
