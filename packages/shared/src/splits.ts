import { z } from 'zod'
import { DIVISION_METHODS, ITEM_GROUP_TYPES } from './enums'

export const splitItemSchema = z.object({
	id: z.uuid().optional(),
	name: z.string().min(1).max(128),
	price: z.number().int().positive(),
	type: z.enum(['product', 'tip', 'delivery', 'service_fee', 'tax']).default('product'),
	quantity: z.string().default('1'),
	defaultDivisionMethod: z.enum(DIVISION_METHODS).default('per_unit'),
	icon: z.string().optional(),
	groupId: z.uuid().optional().nullable(),
})

export const createSplitSchema = z.object({
	id: z.uuid().optional(),
	icon: z.string().optional(),
	name: z.string().min(1).max(255),
	currency: z.string().length(3).default('RUB'),
	items: z.array(splitItemSchema).optional(),
	receiptIds: z.array(z.uuid()).optional(),
})

export const createItemGroupSchema = z.object({
	name: z.string().min(1).max(255),
	icon: z.string().optional(),
	type: z.enum(ITEM_GROUP_TYPES).default('custom'),
})

export const updateItemGroupSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	icon: z.string().optional(),
	isCollapsed: z.boolean().optional(),
})

export const updateItemSchema = splitItemSchema.partial().omit({ id: true })

export const selectItemsSchema = z.object({
	participantId: z.uuid().optional(),
	selections: z.array(
		z.object({
			itemId: z.string().uuid(),
			divisionMethod: z.enum(DIVISION_METHODS),
			value: z.string().optional(),
		}),
	),
})

export type CreateSplitDto = z.infer<typeof createSplitSchema>
export type SplitItemDto = z.infer<typeof splitItemSchema>
export type CreateItemGroupDto = z.infer<typeof createItemGroupSchema>
export type UpdateItemGroupDto = z.infer<typeof updateItemGroupSchema>
export type SelectItemsDto = z.infer<typeof selectItemsSchema>
