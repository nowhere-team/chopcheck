<script lang="ts">
	import { Plus, QrCode } from 'phosphor-svelte'
	import { useDebounce, watch } from 'runed'
	import { SvelteMap, SvelteSet } from 'svelte/reactivity'
	import { fly } from 'svelte/transition'

	import { m } from '$lib/i18n'
	import type { DraftItem, ItemGroup, Participant, SplitItem } from '$lib/services/api/types'
	import { receiptScanner } from '$lib/services/receipts/scanner.svelte'
	import {
		fileToBase64,
		streamReceiptFromImage,
		streamReceiptFromQr
	} from '$lib/services/receipts/stream'
	import { scanQrCode } from '$lib/services/scanner/qr'
	import { getSplitsService } from '$lib/state/context'
	import { AvatarStack, Button, Divider, ExpandableCard } from '$lib/ui/components'
	import ReceiptLoader from '$lib/ui/features/receipts/ReceiptLoader.svelte'
	import ScannerSheet from '$lib/ui/features/receipts/ScannerSheet.svelte'
	import ItemCard from '$lib/ui/features/splits/ItemCard.svelte'
	import ItemEditForm from '$lib/ui/features/splits/ItemEditForm.svelte'
	import ItemGroupCard from '$lib/ui/features/splits/ItemGroupCard.svelte'
	import ParticipantsSheet from '$lib/ui/features/splits/ParticipantsSheet.svelte'
	import { toast } from '$lib/ui/features/toasts'
	import { EditableEmoji, EditableText } from '$lib/ui/forms'
	import Page from '$lib/ui/layouts/Page.svelte'
	import SelectionToolbar from '$lib/ui/layouts/SelectionToolbar.svelte'
	import { BottomSheet } from '$lib/ui/overlays'

	const splitsService = getSplitsService()
	// Using persisted singleton scanner instead of new instance
	const scanner = receiptScanner

	const draft = $derived(splitsService.draft)
	const draftData = $derived(
		draft.current?.split ?? {
			id: undefined,
			name: '',
			icon: '🍔',
			currency: 'RUB',
			items: []
		}
	)
	const participants = $derived<Participant[]>(draft.current?.participants ?? [])
	const items = $derived<SplitItem[]>(draft.current?.items ?? [])
	const itemGroups = $derived<ItemGroup[]>(draft.current?.itemGroups ?? [])

	const groupedItems = $derived(() => {
		const grouped = new SvelteMap<string | null, SplitItem[]>()

		for (const item of items) {
			const groupId = item.groupId ?? null
			if (!grouped.has(groupId)) {
				grouped.set(groupId, [])
			}
			grouped.get(groupId)!.push(item)
		}

		return grouped
	})

	const ungroupedItems = $derived(groupedItems().get(null) ?? [])

	let collapsedGroups = $state<Set<string>>(new Set())

	let draftSplitEmoji = $state('🍔')
	let draftSplitName = $state('')

	// consolidated watcher for external updates
	watch(
		() => [draftData.icon, draftData.name],
		([icon, name]) => {
			if (icon && icon !== draftSplitEmoji) draftSplitEmoji = icon
			if (name && name !== draftSplitName) draftSplitName = name
		}
	)

	// save ONLY metadata (name, icon) - debounced
	const saveMetadata = useDebounce(async () => {
		await splitsService.createOrUpdate({
			id: draftData.id,
			name: draftSplitName,
			icon: draftSplitEmoji,
			currency: draftData.currency
		})
	}, 800)

	// fallback for full sync
	const saveDraftFull = useDebounce(async (overrideItems?: SplitItem[]) => {
		const currentItems = overrideItems ?? items
		const itemsDto = currentItems.map(i => ({
			id: i.id.startsWith('temp-') ? undefined : i.id,
			name: i.name,
			price: i.price,
			quantity: String(i.quantity),
			type: i.type,
			defaultDivisionMethod: i.defaultDivisionMethod,
			icon: i.icon
		}))

		await splitsService.createOrUpdate({
			id: draftData.id,
			name: draftSplitName,
			icon: draftSplitEmoji,
			currency: draftData.currency,
			items: itemsDto
		})
	}, 800)

	let isParticipantsSheetOpen = $state(false)
	let isScannerSheetOpen = $state(false)
	let isItemEditSheetOpen = $state(false)
	let editingItem = $state<DraftItem | null>(null)
	let isGroupEditSheetOpen = $state(false)
	let editingGroup = $state<{ id?: string; name: string; icon: string } | null>(null)

	let selectionMode = $state(false)
	let selectedIds = $state<Set<string>>(new Set())
	const selectedCount = $derived(selectedIds.size)

	const participantStackItems = $derived(
		participants.map(p => ({
			id: p.id,
			name: p.displayName ?? p.user?.displayName ?? m.participants_anonymous(),
			url: p.user?.avatarUrl
		}))
	)

	async function handleNameChange(val: string) {
		draftSplitName = val
		splitsService.updateDraftLocal({ split: { name: val } })
		await saveMetadata()
	}

	async function handleEmojiChange(val: string) {
		draftSplitEmoji = val
		splitsService.updateDraftLocal({ split: { icon: val } })
		await saveMetadata()
	}

	function handleItemClick(item: SplitItem) {
		if (selectionMode) {
			toggleSelection(item.id)
		} else {
			editingItem = {
				id: item.id,
				name: item.name,
				price: item.price,
				quantity: item.quantity,
				type: item.type,
				defaultDivisionMethod: item.defaultDivisionMethod,
				icon: item.icon
			}
			isItemEditSheetOpen = true
		}
	}

	function handleItemLongPress(item: SplitItem) {
		if (!selectionMode) {
			selectionMode = true
			selectedIds = new Set([item.id])
		}
	}

	function toggleSelection(id: string) {
		const newSet = new SvelteSet(selectedIds)
		if (newSet.has(id)) {
			newSet.delete(id)
		} else {
			newSet.add(id)
		}
		selectedIds = newSet
		if (newSet.size === 0) selectionMode = false
	}

	function handleCancelSelection() {
		selectionMode = false
		selectedIds = new Set()
	}

	async function handleDeleteSelected() {
		if (selectedIds.size === 0) return
		const newItems = items.filter(i => !selectedIds.has(i.id))
		handleCancelSelection()

		splitsService.updateDraftLocal({ items: newItems })

		await saveDraftFull(newItems)
		await saveDraftFull.runScheduledNow()
	}

	function handleAddItem() {
		editingItem = {
			name: '',
			price: 0,
			quantity: '1',
			type: 'product',
			defaultDivisionMethod: 'by_fraction',
			icon: '📦'
		}
		isItemEditSheetOpen = true
	}

	function handleSaveItem() {
		if (!editingItem) return

		const itemToSave = { ...editingItem }
		const currentDraftId = draftData.id
		const isNew = !itemToSave.id || itemToSave.id.startsWith('temp-')
		const tempId = isNew ? `temp-${Date.now()}` : itemToSave.id!

		let newItems = [...items]
		if (!isNew) {
			newItems = newItems.map(i =>
				i.id === tempId ? ({ ...i, ...itemToSave } as SplitItem) : i
			)
		} else {
			newItems.push({
				...itemToSave,
				id: tempId,
				quantity: String(itemToSave.quantity)
			} as SplitItem)
		}

		// 1. optimistic update
		splitsService.updateDraftLocal({ items: newItems })

		// 2. unblock ui immediately
		isItemEditSheetOpen = false
		editingItem = null

		// 3. background Sync (fire & forget)
		;(async () => {
			try {
				if (!currentDraftId) {
					await saveDraftFull(newItems)
					await saveDraftFull.runScheduledNow()
				} else {
					if (isNew) {
						await splitsService.addItem(currentDraftId, {
							name: itemToSave.name,
							price: itemToSave.price,
							quantity: String(itemToSave.quantity),
							type: itemToSave.type,
							defaultDivisionMethod: itemToSave.defaultDivisionMethod,
							icon: itemToSave.icon
						})
					} else {
						await splitsService.updateItem(currentDraftId, tempId, {
							name: itemToSave.name,
							price: itemToSave.price,
							quantity: String(itemToSave.quantity),
							type: itemToSave.type,
							defaultDivisionMethod: itemToSave.defaultDivisionMethod,
							icon: itemToSave.icon
						})
					}
				}
			} catch (e) {
				console.error('Failed to save item', e)
				toast.error(m.error_saving())
				await splitsService.draft.refetch()
			}
		})()
	}

	function handleDeleteItem() {
		if (!editingItem?.id) {
			isItemEditSheetOpen = false
			editingItem = null
			return
		}

		const itemId = editingItem.id
		const currentDraftId = draftData.id

		const newItems = items.filter(i => i.id !== itemId)

		// 1. optimistic
		splitsService.updateDraftLocal({ items: newItems })

		// 2. unblock UI
		isItemEditSheetOpen = false
		editingItem = null

		// 3. background sync
		if (currentDraftId && !itemId.startsWith('temp-')) {
			;(async () => {
				try {
					await splitsService.deleteItem(currentDraftId, itemId)
				} catch (e) {
					console.error('Failed to delete item', e)
					toast.error(m.error_item_delete_failed())
					await splitsService.draft.refetch()
				}
			})()
		}
	}

	function toggleGroupCollapsed(groupId: string) {
		const newSet = new SvelteSet(collapsedGroups)
		if (newSet.has(groupId)) {
			newSet.delete(groupId)
		} else {
			newSet.add(groupId)
		}
		collapsedGroups = newSet
	}

	function handleEditGroup(group: ItemGroup) {
		editingGroup = {
			id: group.id,
			name: group.name,
			icon: group.icon || '📦'
		}
		isGroupEditSheetOpen = true
	}

	async function handleDeleteGroup(group: ItemGroup) {
		const currentDraftId = draftData.id
		if (!currentDraftId) return

		const newItems = items.filter(i => i.groupId !== group.id)
		const newGroups = itemGroups.filter(g => g.id !== group.id)

		splitsService.updateDraftLocal({ items: newItems, itemGroups: newGroups })

		try {
			await splitsService.deleteGroup(currentDraftId, group.id)
		} catch (e) {
			console.error('Failed to delete group', e)
			toast.error(m.error_saving())
			await splitsService.draft.refetch()
		}
	}

	async function handleSaveGroup() {
		if (!editingGroup) return

		const currentDraftId = draftData.id
		if (!currentDraftId) return

		const groupData = { ...editingGroup }
		isGroupEditSheetOpen = false
		editingGroup = null

		try {
			if (groupData.id) {
				await splitsService.updateGroup(currentDraftId, groupData.id, {
					name: groupData.name,
					icon: groupData.icon
				})
			} else {
				await splitsService.createGroup(currentDraftId, {
					name: groupData.name,
					icon: groupData.icon,
					type: 'custom'
				})
			}
		} catch (e) {
			console.error('Failed to save group', e)
			toast.error(m.error_saving())
			await splitsService.draft.refetch()
		}
	}

	function getGroupTotal(group: ItemGroup): number {
		const groupItems = groupedItems().get(group.id) ?? []
		return groupItems.reduce((sum, item) => sum + item.price, 0)
	}

	async function handleScanQr() {
		const result = await scanQrCode()
		if (result.success && result.data) {
			scanner.start()
			await streamReceiptFromQr(result.data, e => scanner.handleStreamEvent(e))
		} else if (result.error) {
			toast.error(result.error)
		}
	}

	async function handleUploadImage(file: File) {
		try {
			const base64 = await fileToBase64(file)
			scanner.start()
			await streamReceiptFromImage(base64, e => scanner.handleStreamEvent(e))
		} catch {
			toast.error(m.error_image_processing_failed())
		}
	}

	watch(
		[() => scanner.state, () => scanner.context.receiptData, () => scanner.context.error],
		([state, data, error]) => {
			if (state === 'saving' && data) {
				const rData = data as any
				if (rData.cached) {
					splitsService.draft.refetch()
					toast.success(m.success_receipt_already_exists())
					setTimeout(() => scanner.reset(), 500)
					return
				}

				;(async () => {
					try {
						let splitId = draftData.id
						if (!splitId) {
							const res = await splitsService.createOrUpdate({
								name: draftSplitName,
								currency: draftData.currency,
								items: []
							})
							splitId = res.split.id
						}

						if (splitId) {
							await splitsService.linkReceipt(splitId, rData.receipt.id)
							toast.success(m.success_receipt_uploaded())

							if (
								(!draftSplitName ||
									draftSplitName === m.create_split_default_name()) &&
								scanner.context.storeName
							) {
								const newName = scanner.context.storeName
								draftSplitName = newName
								splitsService.updateDraftLocal({ split: { name: newName } })
								await saveMetadata()
								await saveMetadata.runScheduledNow()
							}

							scanner.saved()
							// scanner.reset is handled internally by class after delay
						}
					} catch {
						scanner.failSave(m.error_save_data_failed())
						toast.error(m.error_saving())
						setTimeout(() => scanner.reset(), 2000)
					}
				})()
			} else if (state === 'error' && error) {
				toast.error(error as string)
				setTimeout(() => scanner.reset(), 2000)
			}
		}
	)
</script>

<SelectionToolbar
	count={selectedCount}
	oncancel={handleCancelSelection}
	ondelete={handleDeleteSelected}
/>

<Page title={m.app_title_create()} navPadding>
	<header class="split-header">
		<EditableEmoji
			bind:value={draftSplitEmoji}
			centered
			size={65}
			onchange={handleEmojiChange}
		/>
		<EditableText
			bind:value={draftSplitName}
			placeholder={m.create_split_name_label()}
			centered
			adaptive
			animated
			onchange={handleNameChange}
		/>
	</header>

	<ExpandableCard
		title={m.split_participants_label()}
		onclick={() => (isParticipantsSheetOpen = true)}
	>
		{#if participants.length === 0}
			<span>{m.participants_empty()}</span>
		{:else}
			<span>{participants.length} {m.participants_short()}</span>
		{/if}

		{#snippet preview()}
			{#if participants.length > 0}
				<AvatarStack items={participantStackItems} max={3} size={28} overlap={8} />
			{/if}
		{/snippet}
	</ExpandableCard>

	<ExpandableCard
		title={m.create_payment_method_title()}
		onclick={() => (isParticipantsSheetOpen = true)}
	>
		{#if participants.length === 0}
			<span>{m.payment_method_not_selected()}</span>
		{:else}
			<span>{m.payment_method_sbp()}</span>
		{/if}
	</ExpandableCard>

	<Divider width={40} spacing="lg" />

	<section class="items-section">
		<div class="section-header">
			<h2>{m.item_section_title()}</h2>
			{#if items.length === 0 && !scanner.isScanning}
				<p class="hint">{m.item_hint_before_publish()}</p>
			{/if}
		</div>

		{#if scanner.isScanning}
			<div transition:fly={{ y: -20, duration: 250 }}>
				<ReceiptLoader
					storeName={scanner.context.storeName}
					storeEmoji={scanner.context.placeEmoji}
					status={scanner.state === 'connecting'
						? m.receipt_status_connecting()
						: scanner.state === 'processing'
							? m.receipt_status_processing()
							: m.receipt_status_saving()}
					itemsLoaded={scanner.context.itemsCount}
					totalItems={scanner.context.totalItems}
					lastScannedItem={scanner.context.lastItem}
				/>
			</div>
		{/if}

		{#each itemGroups as group (group.id)}
			{@const groupItems = groupedItems().get(group.id) ?? []}
			{@const isCollapsed = collapsedGroups.has(group.id)}
			<ItemGroupCard
				{group}
				itemsCount={groupItems.length}
				totalPrice={getGroupTotal(group)}
				collapsed={isCollapsed}
				ontoggle={() => toggleGroupCollapsed(group.id)}
				onedit={() => handleEditGroup(group)}
				ondelete={() => handleDeleteGroup(group)}
			>
				{#each groupItems as item (item.id)}
					<ItemCard
						{item}
						{selectionMode}
						selected={selectedIds.has(item.id)}
						onclick={() => handleItemClick(item)}
						onlongpress={() => handleItemLongPress(item)}
					/>
				{/each}
			</ItemGroupCard>
		{/each}

		{#if ungroupedItems.length > 0}
			{#each ungroupedItems as item (item.id)}
				<ItemCard
					{item}
					{selectionMode}
					selected={selectedIds.has(item.id)}
					onclick={() => handleItemClick(item)}
					onlongpress={() => handleItemLongPress(item)}
				/>
			{/each}
		{/if}

		<div class="action-buttons">
			<Button
				variant="secondary"
				size="md"
				onclick={() => (isScannerSheetOpen = true)}
				disabled={scanner.isScanning}
			>
				{#snippet iconLeft()}
					<QrCode size={20} />
				{/snippet}
				{m.create_split_scan_button()}
			</Button>
			<Button
				variant="secondary"
				size="md"
				onclick={handleAddItem}
				disabled={scanner.isScanning}
			>
				{#snippet iconLeft()}
					<Plus size={20} />
				{/snippet}
				{m.create_split_add_item_button()}
			</Button>
		</div>
	</section>
</Page>

<ParticipantsSheet bind:open={isParticipantsSheetOpen} {participants} />

<ScannerSheet
	bind:open={isScannerSheetOpen}
	onscanqr={handleScanQr}
	onuploadimage={handleUploadImage}
/>

<BottomSheet
	bind:open={isItemEditSheetOpen}
	title={editingItem?.id && !editingItem.id.startsWith('temp-')
		? m.item_edit_title()
		: m.item_new_title()}
>
	{#if editingItem}
		<ItemEditForm
			bind:item={editingItem}
			onSave={handleSaveItem}
			onDelete={handleDeleteItem}
			onCancel={() => (isItemEditSheetOpen = false)}
		/>
	{/if}
</BottomSheet>

<BottomSheet
	bind:open={isGroupEditSheetOpen}
	title={editingGroup?.id ? m.group_edit_title() : m.group_new_title()}
>
	{#if editingGroup}
		<div class="group-edit-form">
			<div class="form-field">
				<label for="group-name">{m.item_name_label()}</label>
				<input
					id="group-name"
					type="text"
					bind:value={editingGroup.name}
					placeholder={m.group_name_placeholder()}
					class="form-input"
				/>
			</div>
			<div class="form-actions">
				<Button variant="secondary" onclick={() => (isGroupEditSheetOpen = false)}>
					{m.action_cancel()}
				</Button>
				<Button variant="primary" onclick={handleSaveGroup}>
					{m.action_save()}
				</Button>
			</div>
		</div>
	{/if}
</BottomSheet>

<style>
	.split-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.items-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.section-header {
		display: flex;
		flex-direction: column;
	}

	.section-header h2 {
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		color: var(--color-text);
		margin: 0;
	}

	.section-header .hint {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
		margin: 0;
	}

	.action-buttons {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-2);
	}

	.group-edit-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.form-field label {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-text-secondary);
	}

	.form-input {
		all: unset;
		width: 100%;
		padding: var(--space-3);
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--text-base);
		color: var(--color-text);
		box-sizing: border-box;
	}

	.form-input:focus {
		border-color: var(--color-primary);
		outline: none;
	}

	.form-actions {
		display: flex;
		gap: var(--space-2);
		justify-content: flex-end;
	}
</style>
