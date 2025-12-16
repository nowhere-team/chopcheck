<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity'

	import type { ItemGroup, SplitItem } from '$lib/services/api/types'

	import ItemCard from './ItemCard.svelte'
	import ItemGroupCard from './ItemGroupCard.svelte'

	interface Props {
		items: SplitItem[]
		itemGroups: ItemGroup[]
		selectionMode?: boolean
		selectedIds?: Set<string>
		collapsedGroups?: Set<string>
		onItemClick?: (item: SplitItem) => void
		onItemLongPress?: (item: SplitItem) => void
		onToggleGroup?: (groupId: string) => void
		onEditGroup?: (group: ItemGroup) => void
		onDeleteGroup?: (group: ItemGroup) => void
	}

	const {
		items,
		itemGroups,
		selectionMode = false,
		selectedIds = new Set(),
		collapsedGroups = new Set(),
		onItemClick,
		onItemLongPress,
		onToggleGroup,
		onEditGroup,
		onDeleteGroup
	}: Props = $props()

	const groupedItems = $derived.by(() => {
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

	const ungroupedItems = $derived(groupedItems.get(null) ?? [])
</script>

<div class="items-list">
	{#each itemGroups as group (group.id)}
		{@const groupItems = groupedItems.get(group.id) ?? []}
		{@const isCollapsed = collapsedGroups.has(group.id)}

		<ItemGroupCard
			{group}
			itemsCount={groupItems.length}
			collapsed={isCollapsed}
			ontoggle={() => onToggleGroup?.(group.id)}
			onedit={() => onEditGroup?.(group)}
			ondelete={() => onDeleteGroup?.(group)}
		>
			{#each groupItems as item (item.id)}
				<ItemCard
					{item}
					{selectionMode}
					selected={selectedIds.has(item.id)}
					onclick={() => onItemClick?.(item)}
					onlongpress={() => onItemLongPress?.(item)}
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
				onclick={() => onItemClick?.(item)}
				onlongpress={() => onItemLongPress?.(item)}
			/>
		{/each}
	{/if}
</div>

<style>
	.items-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
</style>
