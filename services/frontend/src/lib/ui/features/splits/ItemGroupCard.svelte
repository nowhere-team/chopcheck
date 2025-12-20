<script lang="ts">
	import { CaretDown, DotsThree, PencilSimple, Trash, UsersThree } from 'phosphor-svelte'
	import type { Snippet } from 'svelte'

	import { getPlatform } from '$lib/app/context.svelte'
	import { m } from '$lib/i18n'
	import type { ItemGroup, WarningCode } from '$lib/services/api/types'
	import { dismissWarning, getDismissedCodes } from '$lib/state/stores/dismissed.svelte'
	import { Badge, Dropdown, DropdownMenu, DropdownMenuItem, Emoji } from '$lib/ui/components'
	import WarningAlert from '$lib/ui/features/splits/WarningAlert.svelte'
	import WarningBadge from '$lib/ui/features/splits/WarningBadge.svelte'

	interface Props {
		group: ItemGroup
		splitId: string
		itemsCount: number
		collapsed?: boolean
		children?: Snippet
		ontoggle?: () => void
		onedit?: () => void
		ondelete?: () => void
		ondisband?: () => void
	}

	const {
		group,
		splitId,
		itemsCount,
		collapsed = false,
		children,
		ontoggle,
		onedit,
		ondelete,
		ondisband
	}: Props = $props()

	const platform = getPlatform()
	let menuOpen = $state(false)
	let menuAnchor = $state<HTMLButtonElement | undefined>()

	const generalWarnings = $derived((group.warnings ?? []).filter(w => w.itemIndex == null))

	const dismissedCodes = $derived(getDismissedCodes(splitId, group.id))

	const visibleWarnings = $derived(generalWarnings.filter(w => !dismissedCodes.includes(w.code)))
	const hasVisibleWarnings = $derived(visibleWarnings.length > 0)

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

	function handleDisband() {
		menuOpen = false
		ondisband?.()
	}

	function handleDismissWarning(code: WarningCode) {
		dismissWarning(splitId, code, group.id)
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
			{#if hasVisibleWarnings}
				<WarningBadge count={visibleWarnings.length} size={16} />
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
					{#if itemsCount > 0}
						<DropdownMenuItem onclick={handleDisband}>
							{#snippet icon()}
								<UsersThree size={20} />
							{/snippet}
							Расформировать
						</DropdownMenuItem>
					{/if}
					<DropdownMenuItem variant="danger" onclick={handleDelete}>
						{#snippet icon()}
							<Trash size={20} />
						{/snippet}
						{m.group_delete_button()}
					</DropdownMenuItem>
				</DropdownMenu>
			</Dropdown>

			<span class="caret-wrapper">
				<span class="caret" class:collapsed>
					<CaretDown size={18} weight="bold" />
				</span>
			</span>
		</span>
	</div>

	<div class="group-content-wrapper" class:is-collapsed={collapsed}>
		<div class="group-content-inner">
			{#if hasVisibleWarnings}
				<div class="group-warnings">
					<WarningAlert warnings={visibleWarnings} onDismiss={handleDismissWarning} />
				</div>
			{/if}

			{#if children}
				<div class="group-items">
					{@render children()}
				</div>
			{/if}
		</div>
	</div>
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

	.group-content-wrapper {
		display: grid;
		grid-template-rows: 1fr;
		transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.group-content-wrapper.is-collapsed {
		grid-template-rows: 0fr;
	}

	.group-content-inner {
		min-height: 0;
		overflow: hidden;
	}

	.group-warnings {
		padding: 0 var(--space-4) var(--space-3);
	}

	.group-items {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: 0 var(--space-4) var(--space-4);
		content-visibility: auto;
	}
</style>
