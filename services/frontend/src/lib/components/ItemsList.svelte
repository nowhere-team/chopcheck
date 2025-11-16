<script lang="ts">
	import { Plus } from 'phosphor-svelte'

	import Button from '$components/Button.svelte'
	import Emoji from '$components/Emoji.svelte'
	import { m } from '$lib/i18n'
	import type { DraftItem } from '$lib/types/draft'
	import { formatPrice } from '$lib/utils/price'

	interface Props {
		items: DraftItem[]
		currency: string
		onAddItem: () => void
		onEditItem: (index: number) => void
		onOpenScanMenu: () => void
	}

	const { items, currency, onAddItem, onEditItem, onOpenScanMenu }: Props = $props()

	const currencySymbols: Record<string, string> = {
		RUB: '₽',
		USD: '$',
		EUR: '€'
	}
</script>

<div class="items-section">
	<div class="section-header">
		<h2 class="section-title">{m.create_split_positions_title()}</h2>
		<div class="section-actions">
			<Button size="sm" variant="secondary" onclick={onOpenScanMenu}>
				{m.create_split_scan_button()}
			</Button>
			<Button size="sm" variant="primary" onclick={onAddItem}>
				{#snippet iconLeft()}
					<Plus size={20} weight="bold" />
				{/snippet}
				{m.create_split_add_item_button()}
			</Button>
		</div>
	</div>

	{#if items.length === 0}
		<p class="hint">{m.create_split_positions_hint()}</p>
	{:else}
		<div class="items-list">
			{#each items as item, index (index)}
				<button class="item-card" onclick={() => onEditItem(index)} type="button">
					<div class="item-icon">
						<Emoji emoji={item.icon} size={24} />
					</div>
					<div class="item-info">
						<span class="item-name">{item.name}</span>
						<span class="item-quantity">
							{item.quantity}
							{m.quantity_unit()}
						</span>
					</div>
					<span class="item-price">
						{formatPrice(item.price)}
						{currencySymbols[currency] || currency}
					</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.items-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4-m);
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-3-m);
	}

	.section-title {
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		color: var(--color-text-primary);
	}

	.section-actions {
		display: flex;
		gap: var(--spacing-2-m);
	}

	.hint {
		color: var(--color-text-tertiary);
		font-size: var(--text-sm);
		text-align: center;
		padding: var(--spacing-6-m) var(--spacing-4-m);
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2-m);
	}

	.item-card {
		all: unset;
		display: flex;
		align-items: center;
		gap: var(--spacing-3-m);
		padding: var(--spacing-3-m);
		background: var(--color-bg-surface);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-default);
		cursor: pointer;
		transition: all 150ms;
		-webkit-tap-highlight-color: transparent;
	}

	.item-card:active {
		transform: scale(0.99);
		background: var(--color-bg-surface-selected);
	}

	.item-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: var(--color-bg-surface-secondary);
		border-radius: var(--radius-default);
		flex-shrink: 0;
	}

	.item-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-m);
	}

	.item-name {
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		color: var(--color-text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-align: left;
	}

	.item-quantity {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		text-align: left;
	}

	.item-price {
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		color: var(--color-text-primary);
		flex-shrink: 0;
	}
</style>
