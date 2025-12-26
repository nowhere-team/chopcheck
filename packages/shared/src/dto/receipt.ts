import { z } from 'zod'
import { dateSchema, moneySchema, uuidSchema } from '../common'
import { WARNING_CODES } from '../enums'

// --- Sub-Schemas ---

export const warningSchema = z.object({
	code: z.enum(WARNING_CODES),
	itemIndex: z.number().optional(),
	details: z.string().optional()
})

export const bboxCoordsSchema = z.tuple([z.number(), z.number(), z.number(), z.number()]) // [y_min, x_min, y_max, x_max]

export const imageMetadataSchema = z.object({
	index: z.number(),
	bbox: bboxCoordsSchema.nullable(),
	rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)])
})

export const savedImageInfoSchema = z.object({
	id: z.string(),
	index: z.number(),
	isDuplicate: z.boolean().optional(),
	originalUrl: z.string(),
	url: z.string().optional() // signed URL
})

export const receiptItemSchema = z.object({
	id: uuidSchema,
	rawName: z.string(),
	name: z.string().optional(),
	category: z.string().optional(),
	subcategory: z.string().optional(),
	emoji: z.string().optional(),
	price: moneySchema,
	quantity: z.string(),
	unit: z.string().optional(),
	sum: moneySchema,
	discount: moneySchema.optional(),
	suggestedSplitMethod: z.string().optional(),
	warnings: z.array(warningSchema).optional()
})

export const receiptSchema = z.object({
	id: uuidSchema,
	userId: uuidSchema,
	source: z.enum(['qr', 'image', 'manual']),
	status: z.enum(['pending', 'processing', 'enriched', 'failed']),
	placeName: z.string().optional(),
	total: moneySchema,
	currency: z.string(),
	receiptDate: dateSchema.optional(),
	imageMetadata: z.array(imageMetadataSchema).optional(),
	savedImages: z.array(savedImageInfoSchema).optional(),
	createdAt: dateSchema
})

export const receiptWithItemsSchema = z.object({
	receipt: receiptSchema,
	items: z.array(receiptItemSchema)
})

// --- Requests ---

export const scanQrSchema = z.object({
	qrRaw: z.string().min(10).max(512)
})

export const scanImageSchema = z.object({
	image: z.string().min(100).optional(),
	images: z.array(z.string().min(100)).optional(),
	saveImages: z.boolean().optional(),
})

// --- Types ---

export type WarningDto = z.infer<typeof warningSchema>
export type ImageMetadataDto = z.infer<typeof imageMetadataSchema>
export type SavedImageInfoDto = z.infer<typeof savedImageInfoSchema>
export type ReceiptItemDto = z.infer<typeof receiptItemSchema>
export type ReceiptDto = z.infer<typeof receiptSchema>
export type ReceiptWithItemsDto = z.infer<typeof receiptWithItemsSchema>
export type ScanQrDto = z.infer<typeof scanQrSchema>
export type ScanImageDto = z.infer<typeof scanImageSchema>
