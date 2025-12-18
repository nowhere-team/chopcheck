<script lang="ts">
	import { CaretRight } from 'phosphor-svelte'
	import { onMount } from 'svelte'

	import BottomSheet from '$components/BottomSheet.svelte'
	import Box from '$components/Box.svelte'
	import Button from '$components/Button.svelte'
	import PaymentMethodSelector from '$components/PaymentMethodSelector.svelte'
	import Spinner from '$components/Spinner.svelte'
	import { setSplitDraftContext } from '$lib/contexts/split-draft.svelte'
	import { m } from '$lib/i18n'

	const draft = setSplitDraftContext()

	let splitName = $state('')
	let currency = $state('RUB')
	let isPaymentMethodsSheetOpen = $state(false)

	// Track pending selections before confirming
	let pendingSelectedIds = $state<string[]>([])

	const selectedCount = $derived(draft.selectedPaymentMethods.length)
	const hasSelectedMethods = $derived(selectedCount > 0)

	onMount(() => {
		draft.loadPaymentMethods()
	})

	function openPaymentMethodsSheet() {
		// Initialize pending selections from already selected methods
		pendingSelectedIds = draft.selectedPaymentMethods.map(m => m.paymentMethodId)
		isPaymentMethodsSheetOpen = true
	}

	function closePaymentMethodsSheet() {
		isPaymentMethodsSheetOpen = false
		pendingSelectedIds = []
	}

	function handlePendingSelect(methodId: string) {
		if (!pendingSelectedIds.includes(methodId)) {
			pendingSelectedIds = [...pendingSelectedIds, methodId]
		}
	}

	function handlePendingDeselect(methodId: string) {
		pendingSelectedIds = pendingSelectedIds.filter(id => id !== methodId)
	}

	async function confirmPaymentMethodsSelection() {
		// First, create the draft split if it doesn't exist yet
		if (!draft.split) {
			const createdSplit = await draft.createDraft(
				splitName || m.create_split_name_placeholder(),
				currency
			)
			if (!createdSplit) {
				return
			}
		}

		// Get currently selected IDs
		const currentIds = draft.selectedPaymentMethods.map(m => m.paymentMethodId)

		// Find methods to add and remove
		const toAdd = pendingSelectedIds.filter(id => !currentIds.includes(id))
		const toRemove = currentIds.filter(id => !pendingSelectedIds.includes(id))

		// Apply changes
		for (const id of toRemove) {
			await draft.deselectPaymentMethod(id)
		}
		for (const id of toAdd) {
			await draft.selectPaymentMethod(id)
		}

		closePaymentMethodsSheet()
	}

	function getPaymentMethodsBadgeText(): string {
		if (selectedCount === 0) {
			return m.payment_methods_not_selected()
		}
		return m.payment_methods_selected({ count: selectedCount })
	}

	async function handleCreateSplit() {
		if (!splitName.trim()) return

		if (!draft.split) {
			await draft.createDraft(splitName, currency)
		}

		// After creation, the split is ready
		// Future: navigate to the split detail page
	}
</script>

<div class="page">
	<h1 class="title">{m.app_title_create()}</h1>

	<div class="form">
		<div class="field">
			<label class="label" for="split-name">{m.create_split_name_label()}</label>
			<input
				id="split-name"
				type="text"
				class="input"
				placeholder={m.create_split_name_placeholder()}
				bind:value={splitName}
			/>
		</div>

		<div class="field">
			<label class="label" for="currency">{m.create_split_currency_label()}</label>
			<select id="currency" class="input select" bind:value={currency}>
				<option value="RUB">₽ RUB</option>
				<option value="USD">$ USD</option>
				<option value="EUR">€ EUR</option>
			</select>
		</div>

		<Box interactive onclick={openPaymentMethodsSheet}>
			<div class="payment-methods-row">
				<div class="payment-methods-info">
					<span class="payment-methods-label">{m.payment_methods_title()}</span>
					<span class="payment-methods-badge" class:selected={hasSelectedMethods}>
						{getPaymentMethodsBadgeText()}
					</span>
				</div>
				<CaretRight size={20} class="caret" />
			</div>
		</Box>

		<Button
			variant="primary"
			size="lg"
			disabled={!splitName.trim()}
			loading={draft.isCreating}
			onclick={handleCreateSplit}
		>
			{m.action_create_split()}
		</Button>

		{#if draft.error}
			<p class="error">{draft.error}</p>
		{/if}
	</div>
</div>

<BottomSheet isOpen={isPaymentMethodsSheetOpen} onClose={closePaymentMethodsSheet}>
	{#if draft.isLoadingPaymentMethods}
		<div class="sheet-loading">
			<Spinner size="md" />
		</div>
	{:else}
		<PaymentMethodSelector
			availableMethods={draft.availablePaymentMethods}
			selectedMethodIds={pendingSelectedIds}
			isLoading={draft.isLoadingPaymentMethods}
			onSelect={handlePendingSelect}
			onDeselect={handlePendingDeselect}
			onConfirm={confirmPaymentMethodsSelection}
			onCancel={closePaymentMethodsSheet}
		/>
	{/if}
</BottomSheet>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4-m);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2-m);
	}

	.label {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-text-secondary);
	}

	.input {
		width: 100%;
		padding: var(--spacing-3-m) var(--spacing-4-m);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-default);
		font-size: var(--text-base);
		background: var(--color-bg-surface);
		color: var(--color-text-primary);
		transition: border-color 150ms ease;
	}

	.input:focus {
		outline: none;
		border-color: var(--color-button-primary-bg);
	}

	.input::placeholder {
		color: var(--color-text-quaternary);
	}

	.select {
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M2.5 4.5L6 8L9.5 4.5'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 12px center;
		padding-right: 36px;
	}

	.payment-methods-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-3-m);
	}

	.payment-methods-info {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-m);
	}

	.payment-methods-label {
		font-weight: var(--font-medium);
		color: var(--color-text-primary);
	}

	.payment-methods-badge {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
	}

	.payment-methods-badge.selected {
		color: var(--color-button-primary-bg);
	}

	.payment-methods-row :global(.caret) {
		color: var(--color-text-tertiary);
		flex-shrink: 0;
	}

	.error {
		color: #ef4444;
		font-size: var(--text-sm);
		text-align: center;
	}

	.sheet-loading {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: var(--spacing-6-m);
	}
</style>
