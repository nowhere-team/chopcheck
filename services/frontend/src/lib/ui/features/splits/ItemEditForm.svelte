<script lang="ts">
	import { Trash } from 'phosphor-svelte'

	import { m } from '$lib/i18n'
	import type { DraftItem, ItemGroup } from '$lib/services/api/types'
	import { Button, Divider, Input } from '$lib/ui/components'
	import { EditableEmoji, PriceInput, Select } from '$lib/ui/forms'

	interface Props {
		item: DraftItem
		groupId?: string | null
		groups?: ItemGroup[]
		onSave?: (groupId: string | null) => void
		onDelete?: () => void
		onCancel?: () => void
		onRequestCreateGroup?: () => void
	}

	let {
		item = $bindable(),
		groupId = null,
		groups = [],
		onSave,
		onDelete,
		onCancel,
		onRequestCreateGroup
	}: Props = $props()

	let iconValue = $derived(item.icon || '📦')
	let selectedGroupId = $derived(groupId)

	const divisionMethods = [
		{
			value: 'by_fraction',
			label: m.division_method_shares(),
			description: m.division_method_shares_desc()
		},
		{
			value: 'per_unit',
			label: m.division_method_per_unit(),
			description: m.division_method_per_unit_desc()
		},
		{
			value: 'by_amount',
			label: m.division_method_by_amount(),
			description: m.division_method_by_amount_desc()
		},
		{
			value: 'custom',
			label: m.division_method_custom(),
			description: m.division_method_custom_desc()
		}
	]

	const groupOptions = $derived([
		{ value: '__none__', label: 'Без группы' },
		...groups.map(g => ({
			value: g.id,
			label: `${g.icon || '📦'} ${g.name}`
		})),
		{ value: '__new__', label: '+ Создать группу' }
	])

	// compute select value from state
	const groupSelectValue = $derived(selectedGroupId ?? '__none__')

	function handleEmojiChange(newEmoji: string) {
		iconValue = newEmoji
		item.icon = newEmoji
	}

	function handleGroupChange(value: string) {
		if (value === '__new__') {
			onRequestCreateGroup?.()
		} else if (value === '__none__') {
			selectedGroupId = null
		} else {
			selectedGroupId = value
		}
	}

	function handleSave() {
		onSave?.(selectedGroupId)
	}

	// expose method to update group after creation
	export function setGroupId(id: string) {
		selectedGroupId = id
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

		<Select
			label="Группа"
			options={groupOptions}
			value={groupSelectValue}
			onchange={handleGroupChange}
		/>
	</div>

	<Divider />

	<div class="actions">
		<Button variant="danger" onclick={onDelete ?? onCancel}>
			{#snippet iconLeft()}
				<Trash size={24} />
			{/snippet}
		</Button>
		<Button variant="primary" onclick={handleSave} class="save-btn">{m.action_save()}</Button>
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
