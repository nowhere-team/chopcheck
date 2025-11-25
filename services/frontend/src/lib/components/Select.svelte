<script lang="ts">
	import { CaretDown } from 'phosphor-svelte'

	interface Option {
		value: string
		label: string
		description?: string
	}

	interface Props {
		label?: string
		options: Option[]
		value?: string
		placeholder?: string
	}

	let { label, options, value = $bindable(''), placeholder = 'выберите' }: Props = $props()

	let isOpen = $state(false)

	const id = `select-${Math.random().toString(36).slice(2, 11)}`

	const selectedOption = $derived(options.find(opt => opt.value === value))

	function handleSelect(optionValue: string) {
		value = optionValue
		isOpen = false
	}

	function handleToggle() {
		isOpen = !isOpen
	}
</script>

<div class="select-group">
	{#if label}
		<label class="label" for={id}>{label}</label>
	{/if}

	<button
		{id}
		class="select-trigger"
		class:open={isOpen}
		onclick={handleToggle}
		type="button"
		aria-expanded={isOpen}
		aria-haspopup="listbox"
	>
		<span class="select-value">
			{#if selectedOption}
				<span class="option-content">
					<span class="option-label">{selectedOption.label}</span>
					{#if selectedOption.description}
						<span class="option-description">{selectedOption.description}</span>
					{/if}
				</span>
			{:else}
				<span class="placeholder">{placeholder}</span>
			{/if}
		</span>
		<CaretDown size={20} color="var(--color-icon-default)" class="caret" />
	</button>

	{#if isOpen}
		<div class="select-dropdown" role="listbox">
			{#each options as option (option.value)}
				<button
					class="option"
					class:selected={value === option.value}
					onclick={() => handleSelect(option.value)}
					type="button"
					role="option"
					aria-selected={value === option.value}
				>
					<span class="option-content">
						<span class="option-label">{option.label}</span>
						{#if option.description}
							<span class="option-description">{option.description}</span>
						{/if}
					</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.select-group {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2-m);
		position: relative;
	}

	.label {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-text-secondary);
	}

	.select-trigger {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-3-m) var(--spacing-4-m);
		background: var(--color-bg-surface-secondary);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-default);
		cursor: pointer;
		transition: all 150ms;
		gap: var(--spacing-3-m);
	}

	.select-trigger:hover {
		background: var(--color-bg-surface);
	}

	.select-trigger.open {
		border-color: var(--color-button-primary-bg);
		background: var(--color-bg-surface);
	}

	.select-trigger.open :global(.caret) {
		transform: rotate(180deg);
	}

	:global(.caret) {
		transition: transform 200ms;
		flex-shrink: 0;
	}

	.select-value {
		flex: 1;
		text-align: left;
		min-width: 0;
	}

	.placeholder {
		font-size: var(--text-md);
		color: var(--color-text-tertiary);
	}

	.option-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-1-m);
	}

	.option-label {
		font-size: var(--text-md);
		color: var(--color-text-primary);
		font-weight: var(--font-medium);
	}

	.option-description {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
	}

	.select-dropdown {
		position: absolute;
		top: calc(100% + var(--spacing-1-m));
		left: 0;
		right: 0;
		background: var(--color-bg-surface);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-default);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		z-index: 100;
		overflow: hidden;
		animation: slideDown 200ms ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.option {
		width: 100%;
		padding: var(--spacing-3-m) var(--spacing-4-m);
		background: transparent;
		border: none;
		text-align: left;
		cursor: pointer;
		transition: background 150ms;
	}

	.option:hover {
		background: var(--color-bg-surface-secondary);
	}

	.option.selected {
		background: var(--color-bg-surface-selected);
	}

	.option.selected .option-label {
		color: var(--color-button-primary-bg);
		font-weight: var(--font-semibold);
	}
</style>
