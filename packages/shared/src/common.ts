import { z } from 'zod'

// Primitives
export const uuidSchema = z.uuid()
export const dateSchema = z.iso.datetime() // JSON dates are strings
export const moneySchema = z.number().int() // In kopecks/cents

// Utility to make generic paginated response schema
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
	return z.object({
		data: z.array(itemSchema),
		pagination: z.object({
			offset: z.number().int().min(0),
			limit: z.number().int().min(1),
			hasMore: z.boolean(),
		}),
	})
}

export type PaginatedResponse<T> = {
	data: T[]
	pagination: {
		offset: number
		limit: number
		hasMore: boolean
	}
}
