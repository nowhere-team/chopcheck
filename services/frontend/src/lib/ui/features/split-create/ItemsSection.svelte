<script lang="ts">
	import { Plus, QrCode } from 'phosphor-svelte'
	import { fly } from 'svelte/transition'

	import { getPlatform } from '$lib/app/context.svelte'
	import { m } from '$lib/i18n'
	import type { ItemGroup, SplitItem } from '$lib/services/api/types'
	import { receiptScanner } from '$lib/services/receipts/scanner.svelte'
	import { Button } from '$lib/ui/components'
	import ReceiptLoader from '$lib/ui/features/receipts/ReceiptLoader.svelte'
	import ItemsList from '$lib/ui/features/splits/ItemsList.svelte'

	import { getSplitCreateContext } from './context.svelte'

	interface Props {
		items: SplitItem[]
		itemGroups: ItemGroup[]
		splitId: string
		onEditGroup: (group: ItemGroup) => void
		onDeleteGroup: (group: ItemGroup) => void
		onDisbandGroup: (group: ItemGroup) => void
	}

	const { items, itemGroups, splitId, onEditGroup, onDeleteGroup, onDisbandGroup }: Props =
		$props()

	const ctx = getSplitCreateContext()
	const platform = getPlatform()
	const scanner = receiptScanner

	function handleItemClick(item: SplitItem) {
		if (ctx.selection.active) {
			ctx.selection.toggle(item.id)
		} else {
			ctx.sheets.openItemEdit(
				{
					id: item.id,
					name: item.name,
					price: item.price,
					quantity: item.quantity,
					type: item.type,
					defaultDivisionMethod: item.defaultDivisionMethod,
					icon: item.icon
				},
				item.groupId ?? null
			)
		}
	}

	function handleItemLongPress(item: SplitItem) {
		if (!ctx.selection.active) {
			platform.haptic.impact('heavy')
			ctx.selection.startWith(item.id)
		}
	}

	function handleToggleGroup(groupId: string) {
		ctx.toggleGroup(groupId)
	}

	function handleAddItem() {
		ctx.sheets.openNewItem()
	}

	function handleOpenScanner() {
		ctx.sheets.open('scanner')
	}
</script>

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

	<ItemsList
		{items}
		{itemGroups}
		{splitId}
		selectionMode={ctx.selection.active}
		selectedIds={ctx.selection.ids}
		collapsedGroups={ctx.collapsedGroups}
		onItemClick={handleItemClick}
		onItemLongPress={handleItemLongPress}
		onToggleGroup={handleToggleGroup}
		{onEditGroup}
		{onDeleteGroup}
		{onDisbandGroup}
	/>

	<div class="action-buttons">
		<Button
			variant="secondary"
			size="md"
			onclick={handleOpenScanner}
			disabled={scanner.isScanning}
		>
			{#snippet iconLeft()}
				<QrCode size={20} />
			{/snippet}
			{m.create_split_scan_button()}
		</Button>
		<Button variant="secondary" size="md" onclick={handleAddItem} disabled={scanner.isScanning}>
			{#snippet iconLeft()}
				<Plus size={20} />
			{/snippet}
			{m.create_split_add_item_button()}
		</Button>
	</div>
</section>

<style>
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
