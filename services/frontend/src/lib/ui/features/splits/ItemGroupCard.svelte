<script lang="ts">
	import { CaretDown, DotsThree, PencilSimple, Trash } from 'phosphor-svelte'
	import type { Snippet } from 'svelte'
	import { slide } from 'svelte/transition'

	import { getPlatform } from '$lib/app/context.svelte'
	import { m } from '$lib/i18n'
	import type { ItemGroup } from '$lib/services/api/types'
	import { formatPrice } from '$lib/shared/money'
	import { Card } from '$lib/ui/components'

	interface Props {
		group: ItemGroup
		itemsCount: number
		totalPrice: number
		collapsed?: boolean
		children?: Snippet
		ontoggle?: () => void
		onedit?: () => void
		ondelete?: () => void
	}

	const {
		group,
		itemsCount,
		totalPrice,
		collapsed = false,
		children,
		ontoggle,
		onedit,
		ondelete
	}: Props = $props()

	const platform = getPlatform()

	let showMenu = $state(false)

	const groupIcon = $derived(group.icon || (group.type === 'receipt' ? '🧾' : group.type === 'manual' ? '✏️' : '📦'))

	function handleHeaderClick() {
		platform.haptic.selection()
		ontoggle?.()
	}

	function handleMenuClick(e: MouseEvent) {
		e.stopPropagation()
		platform.haptic.selection()
		showMenu = !showMenu
	}

	function handleEdit(e: MouseEvent) {
		e.stopPropagation()
		platform.haptic.selection()
		showMenu = false
		onedit?.()
	}

	function handleDelete(e: MouseEvent) {
		e.stopPropagation()
		platform.haptic.notification('warning')
		showMenu = false
		ondelete?.()
	}

	function handleBackdropClick() {
		showMenu = false
	}
</script>

<div class="item-group">
	<Card class="group-header" interactive onclick={handleHeaderClick}>
		<div class="header-content">
			<div class="left">
				<span class="icon">{groupIcon}</span>
				<div class="info">
					<span class="name">{group.name}</span>
					<span class="meta">{itemsCount} {m.item_total_amount_label()} · {formatPrice(totalPrice)}</span>
				</div>
			</div>

			<div class="right">
				<button class="menu-button" onclick={handleMenuClick} aria-label="Menu">
					<DotsThree size={20} weight="bold" />
				</button>
				<span class="caret" class:collapsed>
					<CaretDown size={16} weight="bold" />
				</span>
			</div>
		</div>
	</Card>

	{#if showMenu}
		<div class="menu-backdrop" onclick={handleBackdropClick} role="presentation"></div>
		<div class="dropdown-menu" transition:slide={{ duration: 150 }}>
			<button class="menu-item" onclick={handleEdit}>
				<PencilSimple size={18} />
				<span>{m.group_rename_button()}</span>
			</button>
			<button class="menu-item danger" onclick={handleDelete}>
				<Trash size={18} />
				<span>{m.group_delete_button()}</span>
			</button>
		</div>
	{/if}

	{#if !collapsed && children}
		<div class="group-content" transition:slide={{ duration: 200 }}>
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.item-group {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	:global(.group-header) {
		padding: var(--space-3) var(--space-4) !important;
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.left {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-width: 0;
	}

	.icon {
		font-size: 24px;
		flex-shrink: 0;
	}

	.info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.name {
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meta {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
	}

	.right {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-shrink: 0;
	}

	.menu-button {
		all: unset;
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

	.menu-button:hover {
		background: var(--color-bg-secondary);
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

	.menu-backdrop {
		position: fixed;
		inset: 0;
		z-index: 100;
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + 4px);
		right: 0;
		z-index: 101;
		min-width: 180px;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		overflow: hidden;
	}

	.menu-item {
		all: unset;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-sm);
		color: var(--color-text);
		cursor: pointer;
		transition: background 0.15s var(--ease-out);
	}

	.menu-item:hover {
		background: var(--color-bg-secondary);
	}

	.menu-item.danger {
		color: var(--color-danger);
	}

	.group-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding-left: var(--space-2);
	}
</style>
