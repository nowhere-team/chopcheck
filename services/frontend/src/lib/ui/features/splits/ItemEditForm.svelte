<script lang="ts">
	import { Trash } from 'phosphor-svelte'

	import { m } from '$lib/i18n'
	import type { DraftItem } from '$lib/services/api/types'
	import { Button, Input } from '$lib/ui/components'
	import { PriceInput, Select } from '$lib/ui/forms'

	interface Props {
		item: DraftItem
		onSave?: () => void
		onDelete?: () => void
		onCancel?: () => void
	}

	const { item = $bindable(), onSave, onDelete, onCancel }: Props = $props()

	const divisionMethods = [
		{
			value: 'equal',
			label: m.division_method_equal(),
			description: m.division_method_equal_desc()
		},
		{
			value: 'shares',
			label: m.division_method_shares(),
			description: m.division_method_shares_desc()
		},
		{
			value: 'custom',
			label: m.division_method_custom(),
			description: m.division_method_custom_desc()
		}
	]
</script>

<form action="#">
	<div class="fields">
		<Input
			label={m.item_name_label()}
			bind:value={item.name}
			placeholder={m.item_name_placeholder()}
		/>

		<div class="row">
			<Input
				label={m.quantity_label()}
				type="number"
				inputmode="numeric"
				bind:value={item.quantity}
			/>
			<PriceInput label={m.item_price_label()} bind:value={item.price} />
		</div>

		<Select
			label={m.item_division_method_label()}
			options={divisionMethods}
			bind:value={item.defaultDivisionMethod}
		/>
	</div>

	<div class="actions">
		<Button variant="danger" onclick={onDelete ?? onCancel}>
			{#snippet iconLeft()}
				<Trash size={24} />
			{/snippet}
		</Button>
		<Button variant="primary" onclick={onSave} class="save-btn">{m.action_save()}</Button>
	</div>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
	}

	.actions {
		display: flex;
		gap: var(--space-3);
		margin-top: var(--space-2);
	}

	:global(.save-btn) {
		flex: 1;
	}
</style>
