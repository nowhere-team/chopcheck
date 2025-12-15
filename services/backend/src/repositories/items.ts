import { and, eq } from 'drizzle-orm'

import type { Item } from '@/common/types'
import { schema } from '@/platform/database'

import { BaseRepository } from './base'

type NewItem = Pick<Item, 'name' | 'price' | 'type' | 'quantity' | 'defaultDivisionMethod'> & {
	id?: string
	receiptItemId?: string
	groupId?: string
	icon?: string
}

export class ItemsRepository extends BaseRepository {
	private key(splitId: string) {
		return `split:${splitId}:items`
	}

	async findBySplitId(splitId: string): Promise<Item[]> {
		return this.cached(this.key(splitId), async () => {
			return this.db.query.splitItems.findMany({
				where: and(eq(schema.splitItems.splitId, splitId), eq(schema.splitItems.isDeleted, false)),
				orderBy: (items, { asc }) => [asc(items.displayOrder)],
			})
		})
	}

	async findById(id: string): Promise<Item | null> {
		const item = await this.db.query.splitItems.findFirst({
			where: and(eq(schema.splitItems.id, id), eq(schema.splitItems.isDeleted, false)),
		})
		return item || null
	}

	async createMany(splitId: string, items: NewItem[], groupId?: string): Promise<Item[]> {
		if (items.length === 0) return []

		const created = await this.db
			.insert(schema.splitItems)
			.values(
				items.map((item, index) => ({
					splitId,
					groupId: item.groupId || groupId,
					receiptItemId: item.receiptItemId,
					name: item.name,
					price: item.price,
					type: item.type || 'product',
					quantity: item.quantity || '1',
					icon: item.icon,
					displayOrder: index,
					defaultDivisionMethod: item.defaultDivisionMethod || 'by_fraction',
				})),
			)
			.returning()

		await this.invalidate(this.key(splitId))
		return created
	}

	async update(id: string, splitId: string, data: Partial<Item>): Promise<void> {
		await this.db
			.update(schema.splitItems)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(schema.splitItems.id, id))

		await this.invalidate(this.key(splitId))
	}

	async softDelete(id: string, splitId: string): Promise<void> {
		await this.db
			.update(schema.splitItems)
			.set({ isDeleted: true, deletedAt: new Date(), updatedAt: new Date() })
			.where(eq(schema.splitItems.id, id))

		await this.invalidate(this.key(splitId))
	}

	async deleteAllForSplit(splitId: string): Promise<void> {
		await this.db
			.update(schema.splitItems)
			.set({ isDeleted: true, deletedAt: new Date(), updatedAt: new Date() })
			.where(and(eq(schema.splitItems.splitId, splitId), eq(schema.splitItems.isDeleted, false)))

		await this.invalidate(this.key(splitId))
	}

	async deleteAllInGroup(splitId: string, groupId: string): Promise<void> {
		await this.db
			.update(schema.splitItems)
			.set({ isDeleted: true, deletedAt: new Date(), updatedAt: new Date() })
			.where(
				and(
					eq(schema.splitItems.splitId, splitId),
					eq(schema.splitItems.groupId, groupId),
					eq(schema.splitItems.isDeleted, false),
				),
			)

		await this.invalidate(this.key(splitId))
	}
}
