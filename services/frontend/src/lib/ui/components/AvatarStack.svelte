<script lang="ts">
	import Avatar from './Avatar.svelte'

	interface StackItem {
		id: string
		name: string
		url?: string
		icon?: string
	}

	interface Props {
		items: StackItem[]
		max?: number
		size?: number
		overlap?: number
	}

	const { items, max = 4, size = 32, overlap = 10 }: Props = $props()

	const visibleItems = $derived(items.slice(0, max))
	const remaining = $derived(items.length - max)
</script>

<div class="avatar-stack" style:--avatar-size="{size}px" style:--overlap="{overlap}px">
	{#each visibleItems as item, i (item.id)}
		<div class="avatar-item" style:z-index={visibleItems.length - i}>
			<Avatar id={item.id} name={item.name} url={item.url} icon={item.icon} {size} />
		</div>
	{/each}

	{#if remaining > 0}
		<div class="avatar-item remaining" style:z-index={0}>
			<span class="count" style:width="{size}px" style:height="{size}px">
				+{remaining}
			</span>
		</div>
	{/if}
</div>

<style>
	.avatar-stack {
		display: flex;
		align-items: center;
	}

	.avatar-item {
		position: relative;
		margin-left: calc(-1 * var(--overlap));
	}

	.avatar-item:first-child {
		margin-left: 0;
	}

	.count {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg-tertiary);
		border-radius: 50%;
		font-size: var(--text-xs);
		font-weight: var(--font-semibold);
		color: var(--color-text-secondary);
		border: 2px solid var(--color-bg);
	}
</style>
