<script lang="ts">
	import { CaretDown, DotsThree, PencilSimple, Trash } from 'phosphor-svelte'
	import type { Snippet } from 'svelte'
	import { slide } from 'svelte/transition'

	import { getPlatform } from '$lib/app/context.svelte'
	import { m } from '$lib/i18n'
	import type { ItemGroup } from '$lib/services/api/types'
	import { Badge, Dropdown, DropdownMenu, DropdownMenuItem, Emoji } from '$lib/ui/components'

	interface Props {
		group: ItemGroup
		itemsCount: number
		collapsed?: boolean
		children?: Snippet
		ontoggle?: () => void
		onedit?: () => void
		ondelete?: () => void
	}

	const {
		group,
		itemsCount,
		collapsed = false,
		children,
		ontoggle,
		onedit,
		ondelete
	}: Props = $props()

	const platform = getPlatform()
	let menuOpen = $state(false)

	function getDefaultIcon(type: string): string {
		switch (type) {
			case 'receipt':
				return '🧾'
			case 'manual':
				return '✏️'
			default:
				return '📦'
		}
	}

	const groupIcon = $derived(group.icon || getDefaultIcon(group.type))

	function handleHeaderClick() {
		platform.haptic.selection()
		ontoggle?.()
	}

	function handleEdit() {
		menuOpen = false
		onedit?.()
	}

	function handleDelete() {
		menuOpen = false
		ondelete?.()
	}
</script>

<div class="item-group">
	<button type="button" class="group-header" onclick={handleHeaderClick}>
		<span class="header-left">
			<Emoji emoji={groupIcon} size={24} />
			<span class="group-name">{group.name}</span>
		</span>

		<span class="header-right">
			<Badge count={itemsCount} size={24} glass={false} />

			<Dropdown bind:open={menuOpen} placement="bottom-end">
				{#snippet trigger()}
					<button
						type="button"
						class="menu-trigger"
						onclick={e => e.stopPropagation()}
						aria-label="Menu"
					>
						<DotsThree size={20} weight="bold" />
					</button>
				{/snippet}

				<DropdownMenu>
					<DropdownMenuItem onclick={handleEdit}>
						{#snippet icon()}
							<PencilSimple size={18} />
						{/snippet}
						{m.group_rename_button()}
					</DropdownMenuItem>
					<DropdownMenuItem variant="danger" onclick={handleDelete}>
						{#snippet icon()}
							<Trash size={18} />
						{/snippet}
						{m.group_delete_button()}
					</DropdownMenuItem>
				</DropdownMenu>
			</Dropdown>

			<span class="caret" class:collapsed>
				<CaretDown size={16} weight="bold" />
			</span>
		</span>
	</button>

	{#if !collapsed && children}
		<div class="group-items" transition:slide={{ duration: 200 }}>
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.item-group {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.group-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-2);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		border-radius: var(--radius-md);
		transition: background 0.15s var(--ease-out);
	}

	.group-header:active {
		background: var(--color-bg-secondary);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
		flex: 1;
	}

	.group-name {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		flex-shrink: 0;
	}

	.menu-trigger {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-md);
		color: var(--color-text-tertiary);
		transition: all 0.15s var(--ease-out);
		cursor: pointer;
	}

	.menu-trigger:hover {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
	}

	.caret {
		display: flex;
		color: var(--color-text-tertiary);
		transition: transform 0.2s var(--ease-out);
	}

	.caret.collapsed {
		transform: rotate(-90deg);
	}

	.group-items {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-2);
	}
</style>
