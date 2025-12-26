// file: services/backend/src/services/receipts/types.ts
import type { ImageMetadata, SavedImageInfo } from '@nowhere-team/catalog/types'

import type { schema } from '@/platform/database'

export type Receipt = typeof schema.receipts.$inferSelect
export type ReceiptItem = typeof schema.receiptItems.$inferSelect
export type NewReceipt = typeof schema.receipts.$inferInsert
export type NewReceiptItem = typeof schema.receiptItems.$inferInsert

export interface ReceiptWithItems {
	receipt: Receipt
	items: ReceiptItem[]
}

export type ReceiptStreamEventType =
	| 'started'
	| 'fns_fetched'
	| 'image_meta'
	| 'item'
	| 'place'
	| 'receipt'
	| 'language'
	| 'warning'
	| 'completed'
	| 'error'

export interface ReceiptStreamEvent {
	type: ReceiptStreamEventType
	data: unknown
}

export interface ProcessedReceipt {
	receipt: Receipt
	items: ReceiptItem[]
	enriched: boolean
}

export interface ReceiptWithImages {
	receipt: Receipt
	items: ReceiptItem[]
	imageMetadata: ImageMetadata[]
	savedImages: SavedImageInfo[]
}
