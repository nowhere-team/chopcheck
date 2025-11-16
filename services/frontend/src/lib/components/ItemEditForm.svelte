<script lang="ts">
	import Button from '$components/Button.svelte'
	import Delimiter from '$components/Delimiter.svelte'
	import EmojiPicker from '$components/EmojiPicker.svelte'
	import Input from '$components/Input.svelte'
	import PriceInput from '$components/PriceInput.svelte'
	import Select from '$components/Select.svelte'
	import { m } from '$lib/i18n'

	interface ItemFormData {
		name: string
		price: number
		quantity: string
		defaultDivisionMethod: 'equal' | 'shares' | 'custom'
		icon?: string
	}

	interface Props {
		item: ItemFormData
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

	let showEmojiPicker = $state(false)

	function handleSelectEmoji(emoji: string) {
		item.icon = emoji
		showEmojiPicker = false
	}

	function validateAndSave() {
		if (!item.name.trim() || item.price <= 0) {
			return
		}
		onSave?.()
	}
</script>

<div class="form">
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
				bind:value={item.quantity}
				suffix={m.quantity_unit()}
				min="0.01"
				step="0.01"
			/>
			<PriceInput label={m.item_price_label()} bind:value={item.price} />
		</div>

		<Select
			label={m.item_division_method_label()}
			options={divisionMethods}
			bind:value={item.defaultDivisionMethod}
		/>

		<button class="emoji-trigger" onclick={() => (showEmojiPicker = true)} type="button">
			<span class="label">{m.item_icon_label()}</span>
			<span class="emoji-preview">{item.icon || '🍽️'}</span>
		</button>

		{#if showEmojiPicker}
			<div class="emoji-overlay" onclick={() => (showEmojiPicker = false)}>
				<div class="emoji-modal" onclick={(e) => e.stopPropagation()}>
					<div class="emoji-modal-header">
						<span>{m.item_icon_label()}</span>
						<button class="close-button" onclick={() => (showEmojiPicker = false)} type="button">
							✕
						</button>
					</div>
					<EmojiPicker selected={item.icon} onselect={handleSelectEmoji} />
				</div>
			</div>
		{/if}
	</div>

	<Delimiter spacing="lg" />

	<div class="actions">
		<Button variant="secondary" onclick={onCancel}>{m.action_cancel()}</Button>
		<Button variant="primary" onclick={validateAndSave}>{m.action_save()}</Button>
	</div>

	<Button variant="danger" onclick={onDelete}>{m.item_delete_button()}</Button>
</div>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6-m);
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4-m);
	}

	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-3-m);
	}

	.emoji-trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-3-m) var(--spacing-4-m);
		background: var(--color-bg-surface-secondary);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-default);
		cursor: pointer;
		transition: all 150ms;
	}

	.emoji-trigger:hover {
		background: var(--color-bg-surface);
	}

	.emoji-trigger .label,
	.emoji-section .label {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-text-secondary);
	}

	.emoji-preview {
		font-size: 28px;
	}

	.emoji-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-4-m);
	}

	.emoji-modal {
		background: var(--color-bg-surface);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border-default);
		max-width: 480px;
		width: 100%;
		max-height: 80vh;
		overflow-y: auto;
		padding: var(--spacing-4-m);
	}

	.emoji-modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-4-m);
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		color: var(--color-text-primary);
	}

	.close-button {
		all: unset;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: var(--radius-default);
		cursor: pointer;
		color: var(--color-text-secondary);
		transition: all 150ms;
	}

	.close-button:hover {
		background: var(--color-bg-surface-secondary);
		color: var(--color-text-primary);
	}

	.close-button:active {
		transform: scale(0.95);
	}

	.actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-3-m);
	}
</style>
