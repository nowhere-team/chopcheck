import { getContext, setContext } from 'svelte'

import {
	addPaymentMethodToSplit,
	getMyPaymentMethods,
	getSplitPaymentMethods,
	removePaymentMethodFromSplit
} from '$api/payment-methods'
import { addItems, createSplit, deleteItem, updateItem } from '$api/splits'
import type {
	AddItemDto,
	ItemGroup,
	PaymentMethod,
	Split,
	SplitPaymentMethod,
	UpdateItemDto
} from '$api/types'

const SPLIT_DRAFT_KEY = Symbol('split-draft')

// Generate a unique ID with fallback for environments without crypto.randomUUID
function generateId(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID()
	}
	// Fallback for older browsers/SSR
	return 'id-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

interface SplitDraftContext {
	// Split data
	split: Split | null
	isCreating: boolean
	isSaving: boolean
	error: string | null

	// Payment methods
	availablePaymentMethods: PaymentMethod[]
	selectedPaymentMethods: SplitPaymentMethod[]
	isLoadingPaymentMethods: boolean

	// Item groups (local state for UI grouping)
	itemGroups: ItemGroup[]
	lastEditedGroupId: string | null

	// Actions
	createDraft: (name: string, currency: string) => Promise<Split | null>
	saveSplit: () => Promise<boolean>
	addItem: (item: AddItemDto) => Promise<void>
	updateItemInDraft: (itemId: string, dto: UpdateItemDto) => Promise<void>
	removeItem: (itemId: string) => Promise<void>

	// Payment methods actions
	loadPaymentMethods: () => Promise<void>
	selectPaymentMethod: (paymentMethodId: string, isPreferred?: boolean) => Promise<void>
	deselectPaymentMethod: (paymentMethodId: string) => Promise<void>
	isPaymentMethodSelected: (paymentMethodId: string) => boolean

	// Group actions
	createGroup: (name: string) => ItemGroup
	addItemToGroup: (groupId: string, itemId: string) => void
	removeItemFromGroup: (groupId: string, itemId: string) => void
	setLastEditedGroup: (groupId: string | null) => void
	getGroupForItem: (itemId: string) => ItemGroup | null

	// Reset
	reset: () => void
}

export function setSplitDraftContext() {
	let split = $state<Split | null>(null)
	let isCreating = $state(false)
	let isSaving = $state(false)
	let error = $state<string | null>(null)

	let availablePaymentMethods = $state<PaymentMethod[]>([])
	let selectedPaymentMethods = $state<SplitPaymentMethod[]>([])
	let isLoadingPaymentMethods = $state(false)

	let itemGroups = $state<ItemGroup[]>([])
	let lastEditedGroupId = $state<string | null>(null)

	const createDraft = async (name: string, currency: string): Promise<Split | null> => {
		isCreating = true
		error = null

		try {
			split = await createSplit({ name, currency })
			return split
		} catch (err) {
			error = err instanceof Error ? err.message : 'Не удалось создать сплит'
			console.error('failed to create split:', err)
			return null
		} finally {
			isCreating = false
		}
	}

	const saveSplit = async (): Promise<boolean> => {
		if (!split) return false

		isSaving = true
		error = null

		try {
			// Split is already created, so we just return success
			// Future: could update split status here
			return true
		} catch (err) {
			error = err instanceof Error ? err.message : 'Не удалось сохранить сплит'
			console.error('failed to save split:', err)
			return false
		} finally {
			isSaving = false
		}
	}

	const addItemToDraft = async (item: AddItemDto): Promise<void> => {
		if (!split) return

		try {
			const updatedSplit = await addItems(split.id, [item])
			split = updatedSplit

			// Track the group if item was added to one
			if (item.groupId) {
				lastEditedGroupId = item.groupId
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Не удалось добавить позицию'
			console.error('failed to add item:', err)
		}
	}

	const updateItemInDraft = async (itemId: string, dto: UpdateItemDto): Promise<void> => {
		if (!split) return

		try {
			const updatedSplit = await updateItem(split.id, itemId, dto)
			split = updatedSplit

			// Track the group if item was added to one
			if (dto.groupId) {
				lastEditedGroupId = dto.groupId
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Не удалось обновить позицию'
			console.error('failed to update item:', err)
		}
	}

	const removeItemFromDraft = async (itemId: string): Promise<void> => {
		if (!split) return

		try {
			const updatedSplit = await deleteItem(split.id, itemId)
			split = updatedSplit

			// Remove from any groups
			itemGroups = itemGroups.map(group => ({
				...group,
				itemIds: group.itemIds.filter(id => id !== itemId)
			}))
		} catch (err) {
			error = err instanceof Error ? err.message : 'Не удалось удалить позицию'
			console.error('failed to remove item:', err)
		}
	}

	const loadPaymentMethods = async (): Promise<void> => {
		isLoadingPaymentMethods = true

		try {
			availablePaymentMethods = await getMyPaymentMethods()

			// If split exists, also load already selected methods
			if (split) {
				selectedPaymentMethods = await getSplitPaymentMethods(split.id)
			}
		} catch (err) {
			console.error('failed to load payment methods:', err)
		} finally {
			isLoadingPaymentMethods = false
		}
	}

	const selectPaymentMethod = async (
		paymentMethodId: string,
		isPreferred = false
	): Promise<void> => {
		if (!split) return

		try {
			await addPaymentMethodToSplit(split.id, { paymentMethodId, isPreferred })

			// Find the payment method and add to selected list
			const method = availablePaymentMethods.find(m => m.id === paymentMethodId)
			if (method) {
				selectedPaymentMethods = [
					...selectedPaymentMethods,
					{
						id: generateId(),
						splitId: split.id,
						paymentMethodId,
						isPreferred,
						displayOrder: selectedPaymentMethods.length,
						paymentMethod: method
					}
				]
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Не удалось добавить способ оплаты'
			console.error('failed to select payment method:', err)
		}
	}

	const deselectPaymentMethod = async (paymentMethodId: string): Promise<void> => {
		if (!split) return

		try {
			await removePaymentMethodFromSplit(split.id, paymentMethodId)
			selectedPaymentMethods = selectedPaymentMethods.filter(
				m => m.paymentMethodId !== paymentMethodId
			)
		} catch (err) {
			error = err instanceof Error ? err.message : 'Не удалось удалить способ оплаты'
			console.error('failed to deselect payment method:', err)
		}
	}

	const isPaymentMethodSelected = (paymentMethodId: string): boolean => {
		return selectedPaymentMethods.some(m => m.paymentMethodId === paymentMethodId)
	}

	const createGroup = (name: string): ItemGroup => {
		const group: ItemGroup = {
			id: generateId(),
			name,
			itemIds: []
		}
		itemGroups = [...itemGroups, group]
		lastEditedGroupId = group.id
		return group
	}

	const addItemToGroup = (groupId: string, itemId: string): void => {
		itemGroups = itemGroups.map(group => {
			if (group.id === groupId) {
				return {
					...group,
					itemIds: [...group.itemIds, itemId]
				}
			}
			// Remove from other groups
			return {
				...group,
				itemIds: group.itemIds.filter(id => id !== itemId)
			}
		})
		lastEditedGroupId = groupId
	}

	const removeItemFromGroup = (groupId: string, itemId: string): void => {
		itemGroups = itemGroups.map(group => {
			if (group.id === groupId) {
				return {
					...group,
					itemIds: group.itemIds.filter(id => id !== itemId)
				}
			}
			return group
		})
	}

	const setLastEditedGroup = (groupId: string | null): void => {
		lastEditedGroupId = groupId
	}

	const getGroupForItem = (itemId: string): ItemGroup | null => {
		return itemGroups.find(group => group.itemIds.includes(itemId)) ?? null
	}

	const reset = (): void => {
		split = null
		isCreating = false
		isSaving = false
		error = null
		availablePaymentMethods = []
		selectedPaymentMethods = []
		isLoadingPaymentMethods = false
		itemGroups = []
		lastEditedGroupId = null
	}

	const context: SplitDraftContext = {
		get split() {
			return split
		},
		get isCreating() {
			return isCreating
		},
		get isSaving() {
			return isSaving
		},
		get error() {
			return error
		},
		get availablePaymentMethods() {
			return availablePaymentMethods
		},
		get selectedPaymentMethods() {
			return selectedPaymentMethods
		},
		get isLoadingPaymentMethods() {
			return isLoadingPaymentMethods
		},
		get itemGroups() {
			return itemGroups
		},
		get lastEditedGroupId() {
			return lastEditedGroupId
		},
		createDraft,
		saveSplit,
		addItem: addItemToDraft,
		updateItemInDraft,
		removeItem: removeItemFromDraft,
		loadPaymentMethods,
		selectPaymentMethod,
		deselectPaymentMethod,
		isPaymentMethodSelected,
		createGroup,
		addItemToGroup,
		removeItemFromGroup,
		setLastEditedGroup,
		getGroupForItem,
		reset
	}

	setContext(SPLIT_DRAFT_KEY, context)
	return context
}

export function getSplitDraftContext() {
	const context = getContext<SplitDraftContext>(SPLIT_DRAFT_KEY)
	if (!context) {
		throw new Error('split draft context not found')
	}
	return context
}
