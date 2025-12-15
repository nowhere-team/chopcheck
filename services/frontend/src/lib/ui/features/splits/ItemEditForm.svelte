<script lang="ts">
	import { Trash } from 'phosphor-svelte'

	import { m } from '$lib/i18n'
	import type { DraftItem } from '$lib/services/api/types'
	import { Button, Divider, Input } from '$lib/ui/components'
	import { EditableEmoji, PriceInput, Select } from '$lib/ui/forms'

	interface Props {
		item: DraftItem
		onSave?: () => void
		onDelete?: () => void
		onCancel?: () => void
	}

	const { item = $bindable(), onSave, onDelete, onCancel }: Props = $props()

	let iconValue = $state(item.icon || '📦')

	const divisionMethods = [
		{
			value: 'by_fraction',
			label: 'По долям', // m.division_method_shares(),
			description: 'Разделить поровну или частями' // m.division_method_shares_desc()
		},
		{
			value: 'per_unit',
			label: 'Поштучно', // implies integer counting
			description: 'Кто сколько съел/выпил'
		},
		{
			value: 'by_amount',
			label: 'Процент или Сумма',
			description: 'Для чаевых и сервисных сборов'
		},
		{
			value: 'custom',
			label: 'Точная сумма', // m.division_method_custom(),
			description: 'Ввести свою сумму' // m.division_method_custom_desc()
		}
	]

	function handleEmojiChange(newEmoji: string) {
		iconValue = newEmoji
		item.icon = newEmoji
	}
</script>

<form onsubmit={e => e.preventDefault()}>
	<div class="fields">
		<div class="name-row">
			<div class="icon-field">
				<EditableEmoji value={iconValue} onchange={handleEmojiChange} size={44} />
			</div>
			<div class="name-input">
				<Input bind:value={item.name} placeholder={m.item_name_placeholder()} />
			</div>
		</div>

		<Divider />

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

	<Divider />

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
		gap: var(--space-2);
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.name-row {
		display: flex;
		gap: var(--space-3);
		align-items: flex-end;
	}

	.icon-field {
		padding-bottom: 2px;
	}

	.name-input {
		flex: 1;
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
