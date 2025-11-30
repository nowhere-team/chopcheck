import { and, desc, eq } from 'drizzle-orm'

import type { Receipt, ReceiptItem } from '@/common/types'
import { schema } from '@/platform/database'

import { BaseRepository } from './base'

type NewReceipt = typeof schema.receipts.$inferInsert
type NewReceiptItem = Omit<typeof schema.receiptItems.$inferInsert, 'receiptId'>

export interface ReceiptWithItems {
	receipt: Receipt
	items: ReceiptItem[]
}

export class ReceiptsRepository extends BaseRepository {
	async findById(id: string): Promise<Receipt | null> {
		const receipt = await this.db.query.receipts.findFirst({
			where: eq(schema.receipts.id, id),
		})
		return receipt || null
	}

	async findByIdWithItems(id: string, userId: string): Promise<ReceiptWithItems | null> {
		const receipt = await this.db.query.receipts.findFirst({
			where: and(eq(schema.receipts.id, id), eq(schema.receipts.userId, userId)),
			with: {
				items: { orderBy: (items, { asc }) => [asc(items.displayOrder)] },
			},
		})

		if (!receipt) return null
		return { receipt, items: receipt.items }
	}

	async findByFiscalData(fiscalNumber: string, fiscalDocument: string): Promise<Receipt | null> {
		const receipt = await this.db.query.receipts.findFirst({
			where: and(
				eq(schema.receipts.fiscalNumber, fiscalNumber),
				eq(schema.receipts.fiscalDocument, fiscalDocument),
			),
		})
		return receipt || null
	}

	async findByUser(userId: string, options: { limit?: number; offset?: number } = {}): Promise<ReceiptWithItems[]> {
		const { limit = 20, offset = 0 } = options

		const receipts = await this.db.query.receipts.findMany({
			where: eq(schema.receipts.userId, userId),
			orderBy: [desc(schema.receipts.createdAt)],
			limit,
			offset,
			with: {
				items: { orderBy: (items, { asc }) => [asc(items.displayOrder)] },
			},
		})

		return receipts.map(r => ({ receipt: r, items: r.items }))
	}

	async findByIds(ids: string[]): Promise<Receipt[]> {
		if (ids.length === 0) return []

		const receipts = await this.db.query.receipts.findMany({
			where: (r, { inArray }) => inArray(r.id, ids),
		})
		return receipts
	}

	async create(data: NewReceipt): Promise<Receipt> {
		const [receipt] = await this.db.insert(schema.receipts).values(data).returning()
		this.logger.debug('receipt created', { receiptId: receipt!.id })
		return receipt!
	}

	async update(id: string, data: Partial<Receipt>): Promise<void> {
		await this.db
			.update(schema.receipts)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(schema.receipts.id, id))
	}

	async getItems(receiptId: string): Promise<ReceiptItem[]> {
		return this.db.query.receiptItems.findMany({
			where: eq(schema.receiptItems.receiptId, receiptId),
			orderBy: (items, { asc }) => [asc(items.displayOrder)],
		})
	}

	async createItems(receiptId: string, items: NewReceiptItem[]): Promise<ReceiptItem[]> {
		if (items.length === 0) return []

		return this.db
			.insert(schema.receiptItems)
			.values(items.map(item => ({ ...item, receiptId })))
			.returning()
	}

	async updateItem(itemId: string, data: Partial<ReceiptItem>): Promise<void> {
		await this.db.update(schema.receiptItems).set(data).where(eq(schema.receiptItems.id, itemId))
	}
}
