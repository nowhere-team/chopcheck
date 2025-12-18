<script lang="ts">
	import { Check } from 'phosphor-svelte'

	import type { PaymentMethod } from '$api/types'
	import Box from '$components/Box.svelte'
	import Button from '$components/Button.svelte'
	import Spinner from '$components/Spinner.svelte'
	import { m } from '$lib/i18n'

	interface Props {
		availableMethods: PaymentMethod[]
		selectedMethodIds: string[]
		isLoading?: boolean
		onSelect: (methodId: string) => void
		onDeselect: (methodId: string) => void
		onConfirm: () => void
		onCancel: () => void
	}

	const {
		availableMethods,
		selectedMethodIds,
		isLoading = false,
		onSelect,
		onDeselect,
		onConfirm,
		onCancel
	}: Props = $props()

	function getMethodTypeLabel(type: PaymentMethod['type']): string {
		const labels: Record<PaymentMethod['type'], () => string> = {
			sbp: () => m.payment_method_type_sbp(),
			card: () => m.payment_method_type_card(),
			phone: () => m.payment_method_type_phone(),
			bank_transfer: () => m.payment_method_type_bank_transfer(),
			cash: () => m.payment_method_type_cash(),
			crypto: () => m.payment_method_type_crypto(),
			custom: () => m.payment_method_type_custom()
		}
		return labels[type]()
	}

	function isSelected(methodId: string): boolean {
		return selectedMethodIds.includes(methodId)
	}

	function toggleMethod(method: PaymentMethod) {
		if (isSelected(method.id)) {
			onDeselect(method.id)
		} else {
			onSelect(method.id)
		}
	}
</script>

<div class="payment-method-selector">
	<div class="header">
		<h2 class="title">{m.payment_methods_select()}</h2>
	</div>

	<div class="content">
		{#if isLoading}
			<div class="loading">
				<Spinner size="md" />
			</div>
		{:else if availableMethods.length === 0}
			<div class="empty">
				<p>{m.payment_methods_empty()}</p>
			</div>
		{:else}
			<div class="methods-list">
				{#each availableMethods as method (method.id)}
					<Box
						interactive
						variant={isSelected(method.id) ? 'active' : 'default'}
						onclick={() => toggleMethod(method)}
					>
						<div class="method-item">
							<div class="method-info">
								<span class="method-type">{getMethodTypeLabel(method.type)}</span>
								{#if method.displayName}
									<span class="method-name">{method.displayName}</span>
								{/if}
							</div>
							{#if isSelected(method.id)}
								<div class="check-icon">
									<Check weight="bold" size={20} />
								</div>
							{/if}
						</div>
					</Box>
				{/each}
			</div>
		{/if}
	</div>

	<div class="actions">
		<Button variant="secondary" onclick={onCancel}>
			{m.action_cancel()}
		</Button>
		<Button variant="primary" onclick={onConfirm}>
			{m.action_select()}
		</Button>
	</div>
</div>

<style>
	.payment-method-selector {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4-m);
		padding: var(--spacing-4-m);
		background: var(--color-bg-page);
		border-radius: var(--radius-default) var(--radius-default) 0 0;
		max-height: 80vh;
	}

	.header {
		text-align: center;
	}

	.title {
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		color: var(--color-text-primary);
		margin: 0;
	}

	.content {
		flex: 1;
		overflow-y: auto;
	}

	.loading,
	.empty {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: var(--spacing-6-m);
		color: var(--color-text-tertiary);
	}

	.methods-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2-m);
	}

	.method-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-3-m);
	}

	.method-info {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-m);
	}

	.method-type {
		font-weight: var(--font-medium);
		color: var(--color-text-primary);
	}

	.method-name {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
	}

	.check-icon {
		color: var(--color-button-primary-bg);
		flex-shrink: 0;
	}

	.actions {
		display: flex;
		gap: var(--spacing-3-m);
		padding-top: var(--spacing-2-m);
		border-top: 1px solid var(--color-border-default);
	}

	.actions :global(button) {
		flex: 1;
	}
</style>
