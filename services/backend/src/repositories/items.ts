import { and, eq } from 'drizzle-orm'

import type { Item } from '@/common/types'
import { schema } from '@/platform/database'

import { BaseRepository } from './base'

export type CreateItemData = Pick<Item, 'name' | 'price' | 'type' | 'quantity' | 'defaultDivisionMethod'>

export class ItemsRepository extends BaseRepository {
	private getCacheKey(splitId: string, suffix: string = 'items'): string {
		return `split:${splitId}:${suffix}`
	}

	async findBySplitId(splitId: string): Promise<Item[]> {
		return this.getOrSet(this.getCacheKey(splitId), async () => {
			return await this.db.query.splitItems.findMany({
				where: and(eq(schema.splitItems.splitId, splitId), eq(schema.splitItems.isDeleted, false)),
				orderBy: (items, { asc }) => [asc(items.displayOrder)],
			})
		})
	}

	async createMany(splitId: string, items: CreateItemData[]): Promise<Item[]> {
		const created = await this.db
			.insert(schema.splitItems)
			.values(
				items.map((item, index) => ({
					splitId,
					name: item.name,
					price: item.price,
					type: item.type || 'product',
					quantity: item.quantity || '1',
					displayOrder: index,
					defaultDivisionMethod: item.defaultDivisionMethod || 'equal',
				})),
			)
			.returning()

		await this.cache.deletePattern(this.getCacheKey(splitId))

		return created
	}

	async update(id: string, splitId: string, data: Partial<Item>): Promise<void> {
		await this.db
			.update(schema.splitItems)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(schema.splitItems.id, id))

		await this.cache.deletePattern(this.getCacheKey(splitId))
	}
}
