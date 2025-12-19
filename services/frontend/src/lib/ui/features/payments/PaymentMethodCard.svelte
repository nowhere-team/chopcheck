<script lang="ts">
	import { DotsThree, PencilSimple, Star, Trash } from 'phosphor-svelte'

	import { getPlatform } from '$lib/app/context.svelte'
	import { m } from '$lib/i18n'
	import type { PaymentMethod } from '$lib/services/api/types'
	import { Card, Dropdown, DropdownMenu, DropdownMenuItem } from '$lib/ui/components'

	import PaymentMethodIcon from './PaymentMethodIcon.svelte'

	interface Props {
		method: PaymentMethod
		onedit?: () => void
		ondelete?: () => void
	}

	const { method, onedit, ondelete }: Props = $props()
	const platform = getPlatform()

	let menuOpen = $state(false)
	let menuAnchor = $state<HTMLButtonElement | undefined>()

	const typeLabels: Record<string, string> = {
		sbp: 'СБП',
		card: 'Банковская карта',
		phone: 'По номеру телефона',
		bank_transfer: 'Банковский перевод',
		cash: 'Наличные',
		crypto: 'Криптовалюта',
		custom: 'Другое'
	}

	const displayName = $derived(method.displayName || typeLabels[method.type] || method.type)

	function toggleMenu(e: MouseEvent) {
		e.stopPropagation()
		menuOpen = !menuOpen
		if (menuOpen) platform.haptic.selection()
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

<Card class="payment-method-card">
	<div class="card-content">
		<div class="left">
			<PaymentMethodIcon type={method.type} size={40} />
			<div class="info">
				<span class="name">
					{displayName}
					{#if method.isDefault}
						<Star size={14} weight="fill" class="default-star" />
					{/if}
				</span>
				<span class="type">{typeLabels[method.type]}</span>
			</div>
		</div>

		<button
			bind:this={menuAnchor}
			type="button"
			class="menu-btn"
			class:active={menuOpen}
			onclick={toggleMenu}
			aria-label="Меню"
		>
			<DotsThree size={24} weight="bold" />
		</button>

		<Dropdown bind:open={menuOpen} anchor={menuAnchor} placement="bottom-end" tail>
			<DropdownMenu>
				<DropdownMenuItem onclick={handleEdit}>
					{#snippet icon()}
						<PencilSimple size={20} />
					{/snippet}
					{m.action_edit()}
				</DropdownMenuItem>
				<DropdownMenuItem variant="danger" onclick={handleDelete}>
					{#snippet icon()}
						<Trash size={20} />
					{/snippet}
					{m.action_delete()}
				</DropdownMenuItem>
			</DropdownMenu>
		</Dropdown>
	</div>
</Card>

<style>
	:global(.payment-method-card) {
		padding: var(--space-3) var(--space-4) !important;
		flex: 1;
	}

	.card-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.left {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex: 1;
		min-width: 0;
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
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	:global(.default-star) {
		color: #f59e0b;
	}

	.type {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
	}

	.menu-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: var(--radius-md);
		color: var(--color-text-tertiary);
		transition: all 0.15s var(--ease-out);
		cursor: pointer;
		flex-shrink: 0;
		background: transparent;
		border: none;
	}

	.menu-btn:hover,
	.menu-btn.active {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
	}
</style>
