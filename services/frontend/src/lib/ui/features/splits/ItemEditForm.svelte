<script lang="ts">
	import { Trash } from 'phosphor-svelte'

	import { m } from '$lib/i18n'
	import type { DraftItem, ItemGroup } from '$lib/services/api/types'
	import { Button, Divider, Input } from '$lib/ui/components'
	import { EditableEmoji, PriceInput, Select } from '$lib/ui/forms'

	interface Props {
		item: DraftItem
		groups?: ItemGroup[]
		onSave?: () => void
		onDelete?: () => void
		onCancel?: () => void
		onCreateGroup?: () => void
	}

	const {
		item = $bindable(),
		groups = [],
		onSave,
		onDelete,
		onCancel,
		onCreateGroup
	}: Props = $props()

	let iconValue = $state(item.icon || '📦')

	const NO_GROUP_VALUE = '__no_group__'
	const CREATE_GROUP_VALUE = '__create_group__'

	const groupOptions = $derived(() => {
		const options = [{ value: NO_GROUP_VALUE, label: m.group_none() }]
		for (const group of groups) {
			options.push({
				value: group.id,
				label: group.icon ? `${group.icon} ${group.name}` : group.name
			})
		}
		options.push({
			value: CREATE_GROUP_VALUE,
			label: m.group_create_new()
		})
		return options
	})

	const selectedGroupValue = $derived(item.groupId ?? NO_GROUP_VALUE)

	function handleGroupChange(value: string) {
		if (value === CREATE_GROUP_VALUE) {
			onCreateGroup?.()
			return
		}
		item.groupId = value === NO_GROUP_VALUE ? null : value
	}

	const divisionMethods = [
		{
			value: 'by_fraction',
			label: m.division_method_shares(),
			description: m.division_method_shares_desc()
		},
		{
			value: 'per_unit',
			label: m.division_method_per_unit(), // implies integer counting
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

		{#if groups.length > 0 || onCreateGroup}
			<Select
				label={m.item_group_label()}
				options={groupOptions()}
				value={selectedGroupValue}
				onchange={handleGroupChange}
			/>
		{/if}
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
