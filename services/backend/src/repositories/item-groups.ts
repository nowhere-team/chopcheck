import { and, eq } from 'drizzle-orm'

import type { ItemGroup } from '@/common/types'
import { schema } from '@/platform/database'
import type { ItemGroupType } from '@/platform/database/schema/enums'

import { BaseRepository } from './base'

type NewItemGroup = Pick<ItemGroup, 'name'> & {
	type?: ItemGroupType
	icon?: string
	receiptId?: string
}

export class ItemGroupsRepository extends BaseRepository {
	private key(splitId: string) {
		return `split:${splitId}:item-groups`
	}

	async findBySplitId(splitId: string): Promise<ItemGroup[]> {
		return this.cached(this.key(splitId), async () => {
			return this.db.query.splitItemGroups.findMany({
				where: and(eq(schema.splitItemGroups.splitId, splitId), eq(schema.splitItemGroups.isDeleted, false)),
				orderBy: (groups, { asc }) => [asc(groups.displayOrder)],
			})
		})
	}

	async findById(id: string): Promise<ItemGroup | null> {
		const group = await this.db.query.splitItemGroups.findFirst({
			where: and(eq(schema.splitItemGroups.id, id), eq(schema.splitItemGroups.isDeleted, false)),
		})
		return group || null
	}

	async findByReceiptId(splitId: string, receiptId: string): Promise<ItemGroup | null> {
		const group = await this.db.query.splitItemGroups.findFirst({
			where: and(
				eq(schema.splitItemGroups.splitId, splitId),
				eq(schema.splitItemGroups.receiptId, receiptId),
				eq(schema.splitItemGroups.isDeleted, false),
			),
		})
		return group || null
	}

	async create(splitId: string, data: NewItemGroup): Promise<ItemGroup> {
		const existingGroups = await this.findBySplitId(splitId)
		const maxOrder = existingGroups.reduce((max, g) => Math.max(max, g.displayOrder), -1)

		const [group] = await this.db
			.insert(schema.splitItemGroups)
			.values({
				splitId,
				receiptId: data.receiptId,
				type: data.type || 'custom',
				name: data.name,
				icon: data.icon,
				displayOrder: maxOrder + 1,
			})
			.returning()

		await this.invalidate(this.key(splitId))
		return group!
	}

	async update(id: string, splitId: string, data: Partial<ItemGroup>): Promise<void> {
		await this.db
			.update(schema.splitItemGroups)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(schema.splitItemGroups.id, id))

		await this.invalidate(this.key(splitId))
	}

	async softDelete(id: string, splitId: string): Promise<void> {
		await this.db
			.update(schema.splitItemGroups)
			.set({ isDeleted: true, deletedAt: new Date(), updatedAt: new Date() })
			.where(eq(schema.splitItemGroups.id, id))

		await this.invalidate(this.key(splitId))
	}
}
