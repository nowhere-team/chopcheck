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
	let menuAnchor = $state<HTMLButtonElement | undefined>()

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

	function handleHeaderKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			handleHeaderClick()
		}
	}

	function toggleMenu(e: MouseEvent) {
		e.stopPropagation()
		menuOpen = !menuOpen
		if (menuOpen) {
			platform.haptic.selection()
		}
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
	<div
		role="button"
		tabindex="0"
		class="group-header"
		onclick={handleHeaderClick}
		onkeydown={handleHeaderKeydown}
		aria-expanded={!collapsed}
	>
		<span class="header-left">
			<Emoji emoji={groupIcon} size={20} />
			<span class="group-name">{group.name}</span>
			{#if itemsCount > 0}
				<div class="badge-wrapper">
					<Badge count={itemsCount} size={24} glass={false} />
				</div>
			{/if}
		</span>

		<span class="header-right">
			<button
				bind:this={menuAnchor}
				type="button"
				class="action-btn"
				class:active={menuOpen}
				onclick={toggleMenu}
				aria-label="Menu"
			>
				<DotsThree size={24} weight="bold" />
			</button>

			<Dropdown bind:open={menuOpen} anchor={menuAnchor} placement="bottom-end" tail>
				<DropdownMenu>
					<DropdownMenuItem onclick={handleEdit}>
						{#snippet icon()}
							<PencilSimple size={20} />
						{/snippet}
						{m.group_rename_button()}
					</DropdownMenuItem>
					<DropdownMenuItem variant="danger" onclick={handleDelete}>
						{#snippet icon()}
							<Trash size={20} />
						{/snippet}
						{m.group_delete_button()}
					</DropdownMenuItem>
				</DropdownMenu>
			</Dropdown>

			<div class="caret-wrapper">
				<span class="caret" class:collapsed>
					<CaretDown size={18} weight="bold" />
				</span>
			</div>
		</span>
	</div>

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
		border-radius: var(--radius-lg);
		background: color-mix(in srgb, var(--color-bg-secondary) 50%, transparent);
		overflow: hidden;
	}

	.group-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
		min-height: 56px;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition: background 0.15s var(--ease-out);
	}

	.group-header:active {
		background: var(--color-bg-secondary);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-width: 0;
		flex: 1;
	}

	.group-name {
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		flex-shrink: 0;
		height: 100%;
	}

	.badge-wrapper {
		margin-right: var(--space-2);
		display: flex;
		align-items: center;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius-md);
		color: var(--color-text-tertiary);
		border: none;
		background: transparent;
		transition: all 0.15s var(--ease-out);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}

	.action-btn:hover,
	.action-btn.active {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
	}

	.action-btn:active {
		transform: scale(0.92);
	}

	.caret-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 40px;
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
		padding: 0 var(--space-4) var(--space-4);
	}
</style>
