import { z } from 'zod'
import { userPublicSchema } from './user'

export const telegramAuthSchema = z.object({
	initData: z.string().min(1),
})

export const authResponseSchema = z.object({
	accessToken: z.string(),
	user: userPublicSchema,
})

export type TelegramAuthDto = z.infer<typeof telegramAuthSchema>
export type AuthResponseDto = z.infer<typeof authResponseSchema>
