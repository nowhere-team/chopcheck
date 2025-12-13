<script lang="ts">
	import { Plus, QrCode } from 'phosphor-svelte'
	import { onMount } from 'svelte'
	import { SvelteSet } from 'svelte/reactivity'

	import { m } from '$lib/i18n'
	import type { CreateSplitDto, DraftItem, Participant, SplitItem } from '$lib/services/api/types'
	import {
		fileToBase64,
		type ReceiptCompleteData,
		type ReceiptStreamEvent,
		streamReceiptFromImage,
		streamReceiptFromQr
	} from '$lib/services/receipts/stream'
	import { scanQrCode } from '$lib/services/scanner/qr'
	import { getSplitsStore } from '$lib/state'
	import { AvatarStack, Button, Divider, ExpandableCard } from '$lib/ui/components'
	import ReceiptLoader from '$lib/ui/features/receipts/ReceiptLoader.svelte'
	import ScannerSheet from '$lib/ui/features/receipts/ScannerSheet.svelte'
	import ItemCard from '$lib/ui/features/splits/ItemCard.svelte'
	import ItemEditForm from '$lib/ui/features/splits/ItemEditForm.svelte'
	import ParticipantsSheet from '$lib/ui/features/splits/ParticipantsSheet.svelte'
	import { toast } from '$lib/ui/features/toasts'
	import { EditableEmoji, EditableText } from '$lib/ui/forms'
	import Page from '$lib/ui/layouts/Page.svelte'
	import SelectionToolbar from '$lib/ui/layouts/SelectionToolbar.svelte'
	import { BottomSheet } from '$lib/ui/overlays'

	const splitsStore = getSplitsStore()
	onMount(() => {
		splitsStore.draft.fetch()
	})

	const draftQuery = $derived(splitsStore.draft)
	const draftData = $derived(
		draftQuery.data?.split ?? {
			id: undefined,
			name: '',
			icon: '🍔',
			currency: 'RUB',
			items: []
		}
	)
	const participants = $derived<Participant[]>(draftQuery.data?.participants ?? [])
	const items = $derived<SplitItem[]>(draftQuery.data?.items ?? [])

	let draftSplitEmoji = $state('🍔')
	let draftSplitName = $state('')
	let isTyping = false

	$effect(() => {
		if (!isTyping) {
			if (draftData.icon) draftSplitEmoji = draftData.icon
			if (draftData.name) draftSplitName = draftData.name
		}
	})

	let isParticipantsSheetOpen = $state(false)
	let isScannerSheetOpen = $state(false)
	let isItemEditSheetOpen = $state(false)
	let editingItem = $state<DraftItem | null>(null)

	let selectionMode = $state(false)
	let selectedIds = $state<Set<string>>(new Set())
	const selectedCount = $derived(selectedIds.size)

	let isLoadingReceipt = $state(false)
	let receiptStatus = $state('')
	let receiptStoreName = $state<string | undefined>(undefined)
	let receiptItemsLoaded = $state(0)
	let receiptTotalItems = $state<number | undefined>(undefined)
	let lastScannedItem = $state<string | undefined>(undefined)

	const participantStackItems = $derived(
		participants.map(p => ({
			id: p.id,
			name: p.displayName ?? p.user?.displayName ?? 'Аноним',
			url: p.user?.avatarUrl
		}))
	)

	let saveTimeout: ReturnType<typeof setTimeout> | undefined

	async function saveDraft(overrideItems?: SplitItem[]) {
		const currentItems = overrideItems ?? items

		let itemsDto: CreateSplitDto['items'] | undefined = undefined

		if (currentItems) {
			itemsDto = currentItems.map(i => ({
				id: i.id.startsWith('temp-') ? undefined : i.id,
				name: i.name,
				price: i.price,
				quantity: String(i.quantity),
				type: i.type,
				defaultDivisionMethod: i.defaultDivisionMethod
			}))
		}

		const payload: CreateSplitDto & { id?: string } = {
			id: draftData.id,
			name: draftSplitName,
			icon: draftSplitEmoji,
			currency: draftData.currency,
			items: itemsDto
		}

		await splitsStore.createOrUpdate.mutate(payload)
		await splitsStore.draft.refetch()
	}

	async function saveMetadataOnly() {
		const payload: CreateSplitDto & { id?: string } = {
			id: draftData.id,
			name: draftSplitName,
			icon: draftSplitEmoji,
			currency: draftData.currency,
			items: undefined
		}
		await splitsStore.createOrUpdate.mutate(payload)
		await splitsStore.draft.refetch()
	}

	function handleNameChange(val: string) {
		draftSplitName = val
		isTyping = true

		if (saveTimeout) clearTimeout(saveTimeout)
		saveTimeout = setTimeout(async () => {
			await saveMetadataOnly()
			isTyping = false
		}, 800)
	}

	function handleEmojiChange(val: string) {
		isTyping = true
		draftSplitEmoji = val
		saveMetadataOnly().finally(() => {
			setTimeout(() => {
				isTyping = false
			}, 500)
		})
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
				defaultDivisionMethod: item.defaultDivisionMethod as 'equal' | 'shares' | 'custom',
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

		if (newSet.size === 0) {
			selectionMode = false
		}
	}

	function handleCancelSelection() {
		selectionMode = false
		selectedIds = new Set()
	}

	async function handleDeleteSelected() {
		if (selectedIds.size === 0) return

		const newItems = items.filter(i => !selectedIds.has(i.id))
		handleCancelSelection()
		await saveDraft(newItems)
	}

	function handleAddItem() {
		editingItem = {
			name: '',
			price: 0,
			quantity: '1',
			type: 'product',
			defaultDivisionMethod: 'equal'
		}
		isItemEditSheetOpen = true
	}

	async function handleSaveItem() {
		if (!editingItem) return

		let newItems = [...items]

		if (editingItem.id) {
			newItems = newItems.map(i =>
				i.id === editingItem!.id ? ({ ...i, ...editingItem } as SplitItem) : i
			)
		} else {
			const newItem: SplitItem = {
				...editingItem,
				id: `temp-${Date.now()}`,
				quantity: String(editingItem.quantity)
			} as SplitItem
			newItems.push(newItem)
		}

		isItemEditSheetOpen = false
		editingItem = null

		await saveDraft(newItems)
	}

	async function handleDeleteItem() {
		if (!editingItem?.id) {
			isItemEditSheetOpen = false
			editingItem = null
			return
		}

		const newItems = items.filter(i => i.id !== editingItem!.id)
		isItemEditSheetOpen = false
		editingItem = null

		await saveDraft(newItems)
	}

	function resetReceiptState() {
		isLoadingReceipt = false
		receiptStatus = ''
		receiptItemsLoaded = 0
		receiptTotalItems = undefined
		receiptStoreName = undefined
		lastScannedItem = undefined
	}

	function handleReceiptEvent(event: ReceiptStreamEvent) {
		switch (event.type) {
			case 'started':
				isLoadingReceipt = true
				receiptStatus = 'Подключение...'
				break

			case 'fns_fetched':
				receiptStatus = 'Получение данных...'
				receiptTotalItems = event.data.itemCount
				break

			case 'item': {
				receiptItemsLoaded++
				const item = event.data as { name?: string; rawName?: string; emoji?: string }
				const itemName = item.name || item.rawName
				if (itemName) {
					receiptStatus = 'Распознавание...'
					lastScannedItem = item.emoji ? `${item.emoji} ${itemName}` : itemName
				}
				break
			}

			case 'place': {
				const place = event.data as { name?: string }
				if (place.name) {
					receiptStoreName = place.name
				}
				break
			}

			case 'completed': {
				const data = event.data as ReceiptCompleteData
				handleReceiptCompleted(data)
				break
			}

			case 'error':
				toast.error('Ошибка обработки чека: ' + (event.data as any).message)
				resetReceiptState()
				break

			case 'stream_end':
				if (isLoadingReceipt && receiptStatus !== 'Сохранение...') {
					resetReceiptState()
				}
				break
		}
	}

	async function handleReceiptCompleted(data: ReceiptCompleteData) {
		receiptStatus = 'Сохранение...'
		try {
			if (data.cached) {
				await splitsStore.draft.refetch()
				toast.success('Чек уже был загружен ранее')
				resetReceiptState()
				return
			}

			if (!draftData.id) {
				await saveDraft([])
			}

			await splitsStore.linkReceipt.mutate({
				splitId: draftData.id!,
				receiptId: data.receipt.id
			})

			await splitsStore.draft.refetch()
			toast.success('Чек успешно загружен')

			if ((!draftSplitName || draftSplitName === 'Новый сплит') && receiptStoreName) {
				draftSplitName = receiptStoreName
				await saveMetadataOnly()
			}
		} catch (e) {
			console.error(e)
			toast.error('Не удалось сохранить товары')
		} finally {
			resetReceiptState()
		}
	}

	async function handleScanQr() {
		const result = await scanQrCode()
		if (result.success && result.data) {
			await streamReceiptFromQr(result.data, handleReceiptEvent)
		} else if (result.error) {
			toast.error(result.error)
		}
	}

	async function handleUploadImage(file: File) {
		try {
			const base64 = await fileToBase64(file)
			await streamReceiptFromImage(base64, handleReceiptEvent)
		} catch (e) {
			console.error(e)
			toast.error('Не удалось обработать изображение')
			resetReceiptState()
		}
	}
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
			size={48}
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
			<span>{participants.length} чел.</span>
		{/if}

		{#snippet preview()}
			{#if participants.length > 0}
				<AvatarStack items={participantStackItems} max={3} size={28} overlap={8} />
			{/if}
		{/snippet}
	</ExpandableCard>

	<ExpandableCard title="Платежный метод" onclick={() => (isParticipantsSheetOpen = true)}>
		{#if participants.length === 0}
			<span>Не выбран</span>
		{:else}
			<span>СБП</span>
		{/if}
	</ExpandableCard>
	<Divider width={40} spacing="lg" />
	<section class="items-section">
		<div class="section-header">
			<h2>Позиции</h2>
			{#if items.length === 0 && !isLoadingReceipt}
				<p class="hint">Разделение будет доступно после публикации сплита</p>
			{/if}
		</div>

		{#if isLoadingReceipt}
			<ReceiptLoader
				storeName={receiptStoreName}
				status={receiptStatus}
				itemsLoaded={receiptItemsLoaded}
				totalItems={receiptTotalItems}
				{lastScannedItem}
			/>
		{/if}

		{#if items.length > 0}
			{#each items as item (item.id)}
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
				disabled={isLoadingReceipt}
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
				disabled={isLoadingReceipt}
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
		? 'Редактировать'
		: 'Новая позиция'}
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
</style>
