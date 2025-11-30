import type { schema } from '@/platform/database'

export type Receipt = typeof schema.receipts.$inferSelect
export type ReceiptItem = typeof schema.receiptItems.$inferSelect
export type NewReceipt = typeof schema.receipts.$inferInsert
export type NewReceiptItem = typeof schema.receiptItems.$inferInsert

export interface ReceiptWithItems extends Receipt {
	items: ReceiptItem[]
}

export interface ReceiptStreamEvent {
	type: 'started' | 'fns_fetched' | 'item' | 'place' | 'receipt' | 'completed' | 'error'
	data: unknown
}

export interface ProcessedReceipt {
	receipt: Receipt
	items: ReceiptItem[]
	enriched: boolean
}
