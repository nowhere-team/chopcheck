import { z } from 'zod'
import { dateSchema, moneySchema, uuidSchema } from '../common'
import { DIVISION_METHODS, ITEM_GROUP_TYPES, SPLIT_PHASES, SPLIT_STATUSES } from '../enums'
import { itemBboxSchema, warningSchema } from './receipt'
import { userPublicSchema } from './user'

// --- Entities ---

export const splitItemSchema = z.object({
	id: uuidSchema,
	name: z.string(),
	price: moneySchema,
	quantity: z.string(), // decimal string
	type: z.enum(['product', 'tip', 'delivery', 'service_fee', 'tax']),
	defaultDivisionMethod: z.enum(DIVISION_METHODS),
	icon: z.string().optional().nullable(),
	groupId: uuidSchema.optional().nullable(),
	unit: z.string().optional().default('piece'),
	warnings: z.array(warningSchema).optional().default([]),
	// New fields for crop support
	bbox: itemBboxSchema.nullable().optional(),
	receiptId: uuidSchema.nullable().optional(),
})

export const itemGroupSchema = z.object({
	id: uuidSchema,
	splitId: uuidSchema,
	name: z.string(),
	type: z.enum(ITEM_GROUP_TYPES),
	icon: z.string().optional().nullable(),
	displayOrder: z.number(),
	isCollapsed: z.boolean(),
	warnings: z.array(warningSchema).optional().default([]),
	createdAt: dateSchema,
	// Useful to have receiptId on group level too if needed, but item level is critical for crop
	receiptId: uuidSchema.nullable().optional(),
})

export const participantSchema = z.object({
	id: uuidSchema,
	userId: uuidSchema.nullable(),
	displayName: z.string().nullable(),
	isAnonymous: z.boolean(),
	joinedAt: dateSchema,
	user: userPublicSchema.nullable()
})

export const splitSchema = z.object({
	id: uuidSchema,
	shortId: z.string().optional().nullable(),
	name: z.string(),
	icon: z.string().optional().nullable(),
	currency: z.string(),
	status: z.enum(SPLIT_STATUSES),
	phase: z.enum(SPLIT_PHASES),
	maxParticipants: z.number().nullable().optional(),
	expectedParticipants: z.number().nullable().optional(),
	createdAt: dateSchema,
	updatedAt: dateSchema
})

// --- Calculations ---

export const calculationItemResultSchema = z.object({
	baseAmount: moneySchema,
	discountAmount: moneySchema,
	finalAmount: moneySchema,
	divisionMethod: z.string(),
	participationValue: z.string().optional()
})

export const calculationParticipantSchema = z.object({
	participantId: uuidSchema,
	displayName: z.string(),
	totalBase: moneySchema,
	totalDiscount: moneySchema,
	totalDiscountPercent: z.string().optional(),
	totalFinal: moneySchema,
	items: z.record(z.string(), calculationItemResultSchema) // itemId -> calc
})

export const splitCalculationsSchema = z.object({
	participants: z.array(calculationParticipantSchema),
	totals: z.object({
		splitAmount: moneySchema,
		collected: moneySchema,
		difference: moneySchema
	})
})

// --- Aggregates (Responses) ---

export const splitResponseSchema = z.object({
	split: splitSchema,
	items: z.array(splitItemSchema),
	itemGroups: z.array(itemGroupSchema),
	participants: z.array(participantSchema),
	calculations: splitCalculationsSchema.optional(),
	receipts: z.array(z.object({
		id: uuidSchema,
		placeName: z.string().nullable().optional(),
		total: moneySchema,
		createdAt: dateSchema
	})).optional()
})

// --- Requests (Inputs) ---

export const createSplitSchema = z.object({
	id: uuidSchema.optional(), // for idempotency/draft updates
	icon: z.string().optional(),
	name: z.string().min(1).max(255),
	currency: z.string().length(3).default('RUB'),
	items: z.array(
		// Input Item Schema (slightly looser than Response)
		z.object({
			id: uuidSchema.optional(),
			name: z.string().min(1).max(128),
			price: z.number().int().positive(),
			type: z.enum(['product', 'tip', 'delivery', 'service_fee', 'tax']).default('product'),
			quantity: z.string().default('1'),
			defaultDivisionMethod: z.enum(DIVISION_METHODS).default('per_unit'),
			icon: z.string().optional(),
			groupId: uuidSchema.optional().nullable(),
		})
	).optional(),
	receiptIds: z.array(uuidSchema).optional(),
})

export const createItemGroupDtoSchema = z.object({
	name: z.string().min(1).max(255),
	icon: z.string().optional(),
	type: z.enum(ITEM_GROUP_TYPES).default('custom'),
})

export const updateItemGroupDtoSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	icon: z.string().optional(),
	isCollapsed: z.boolean().optional(),
})

export const selectItemsDtoSchema = z.object({
	participantId: uuidSchema.optional(),
	selections: z.array(
		z.object({
			itemId: uuidSchema,
			divisionMethod: z.enum(DIVISION_METHODS),
			value: z.string().optional(),
		}),
	),
})

export const addItemsDtoSchema = z.object({
	items: z.array(
		z.object({
			name: z.string().min(1).max(128),
			price: z.number().int().positive(),
			type: z.enum(['product', 'tip', 'delivery', 'service_fee', 'tax']).default('product'),
			quantity: z.string().default('1'),
			defaultDivisionMethod: z.enum(DIVISION_METHODS),
			icon: z.string().optional(),
			groupId: uuidSchema.optional().nullable(),
		}),
	),
})

export const updateItemDtoSchema = z.object({
	name: z.string().min(1).max(128).optional(),
	price: z.number().int().positive().optional(),
	type: z.enum(['product', 'tip', 'delivery', 'service_fee', 'tax']).optional(),
	quantity: z.string().optional(),
	defaultDivisionMethod: z.enum(DIVISION_METHODS).optional(),
	icon: z.string().optional(),
	groupId: uuidSchema.nullable().optional(),
})

// --- Types ---

export type SplitItemDto = z.infer<typeof splitItemSchema>
export type ItemGroupDto = z.infer<typeof itemGroupSchema>
export type ParticipantDto = z.infer<typeof participantSchema>
export type SplitDto = z.infer<typeof splitSchema>
export type SplitCalculationsDto = z.infer<typeof splitCalculationsSchema>
export type SplitResponseDto = z.infer<typeof splitResponseSchema>

export type CreateSplitDto = z.infer<typeof createSplitSchema>
export type CreateItemGroupDto = z.infer<typeof createItemGroupDtoSchema>
export type UpdateItemGroupDto = z.infer<typeof updateItemGroupDtoSchema>
export type SelectItemsDto = z.infer<typeof selectItemsDtoSchema>
export type AddItemsDto = z.infer<typeof addItemsDtoSchema>
export type UpdateItemDto = z.infer<typeof updateItemDtoSchema>
