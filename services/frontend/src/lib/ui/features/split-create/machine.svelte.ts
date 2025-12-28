// file: services/frontend/src/lib/ui/features/split-create/machine.svelte.ts

import type { DraftItem, ItemBboxDto, ItemGroup } from '$lib/services/api/types'

export type SheetType =
	| 'participants'
	| 'payment-methods'
	| 'scanner'
	| 'item-edit'
	| 'group-create'
	| 'group-edit'
	| null

export interface SheetContextData {
	editingItem: DraftItem | null
	editingItemGroupId: string | null
	editingItemBbox: ItemBboxDto | null
	receiptId: string | null
	isNewItem: boolean
	editingGroup: { id: string; name: string; icon: string } | null
}

export class SheetMachine {
	current = $state<SheetType>(null)

	context = $state<SheetContextData>({
		editingItem: null,
		editingItemGroupId: null,
		editingItemBbox: null,
		receiptId: null,
		isNewItem: false,
		editingGroup: null
	})

	private resetContext(): void {
		this.context = {
			editingItem: null,
			editingItemGroupId: null,
			editingItemBbox: null,
			receiptId: null,
			isNewItem: false,
			editingGroup: null
		}
	}

	open(sheet: SheetType): void {
		this.current = sheet
	}

	close(): void {
		this.current = null
		setTimeout(() => this.resetContext(), 300)
	}

	openItemEdit(
		item: DraftItem,
		groupId: string | null = null,
		options?: { receiptId?: string | null; bbox?: ItemBboxDto | null }
	): void {
		this.context = {
			...this.context,
			editingItem: {
				// @ts-expect-error types
				unit: 'piece',
				// @ts-expect-error types
				warnings: [],
				...item
			},
			editingItemGroupId: groupId,
			editingItemBbox: options?.bbox ?? null,
			receiptId: options?.receiptId ?? null,
			isNewItem: !item.id || item.id.startsWith('temp-')
		}
		this.current = 'item-edit'
	}

	openNewItem(): void {
		const newItem: DraftItem = {
			name: '',
			price: 0,
			quantity: '1',
			type: 'product',
			defaultDivisionMethod: 'by_fraction',
			icon: '📦',
			unit: 'piece',
			warnings: []
		}
		this.openItemEdit(newItem, null)
	}

	openGroupEdit(group: ItemGroup): void {
		this.context = {
			...this.context,
			editingGroup: {
				id: group.id,
				name: group.name,
				icon: group.icon || '📦'
			}
		}
		this.current = 'group-edit'
	}

	openGroupCreate(): void {
		this.current = 'group-create'
	}

	setEditingItemGroupId(id: string | null): void {
		this.context = { ...this.context, editingItemGroupId: id }
	}

	updateEditingItem(updates: Partial<DraftItem>): void {
		if (this.context.editingItem) {
			this.context = {
				...this.context,
				editingItem: { ...this.context.editingItem, ...updates }
			}
		}
	}
}

export function createSheetMachine(): SheetMachine {
	return new SheetMachine()
}
