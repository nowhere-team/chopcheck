<script lang="ts">
	import { CaretDown, Check } from 'phosphor-svelte'

	import { getPlatform } from '$lib/app/context.svelte'
	import { Dropdown, Label } from '$lib/ui/components'

	interface Option {
		value: string
		label: string
		description?: string
	}

	interface Props {
		value: string
		options: Option[]
		label?: string
		onchange?: (value: string) => void
	}

	let { value = $bindable(), options, label, onchange }: Props = $props()
	const platform = getPlatform()

	let isOpen = $state(false)
	let triggerRef = $state<HTMLButtonElement | undefined>()

	const currentLabel = $derived(options.find(o => o.value === value)?.label || value)

	function toggle(e: MouseEvent) {
		e.stopPropagation()
		if (!isOpen) {
			platform.haptic.selection()
		}
		isOpen = !isOpen
	}

	function select(val: string) {
		if (val === value) {
			isOpen = false
			return
		}
		value = val
		onchange?.(val)
		isOpen = false
		platform.haptic.impact('light')
	}
</script>

<div class="select-wrapper">
	{#if label}
		<Label>{label}</Label>
	{/if}

	<button
		bind:this={triggerRef}
		type="button"
		class="trigger"
		class:active={isOpen}
		onclick={toggle}
	>
		<span class="value-text">{currentLabel}</span>
		<span class="icon-wrap" style:transform={isOpen ? 'rotate(180deg)' : 'rotate(0)'}>
			<CaretDown size={16} weight="bold" />
		</span>
	</button>

	<Dropdown
		bind:open={isOpen}
		anchor={triggerRef}
		placement="auto"
		onclose={() => (isOpen = false)}
	>
		<div class="options-list">
			{#each options as option (option.value)}
				<button
					type="button"
					class="option-item"
					class:selected={option.value === value}
					onclick={() => select(option.value)}
				>
					<span class="option-content">
						<span class="option-label">{option.label}</span>
						{#if option.description}
							<span class="option-desc">{option.description}</span>
						{/if}
					</span>
					{#if option.value === value}
						<div class="check-icon">
							<Check size={16} weight="bold" />
						</div>
					{/if}
				</button>
			{/each}
		</div>
	</Dropdown>
</div>

<style>
	.select-wrapper {
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: 100%;
	}

	.trigger {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		background: var(--color-bg-secondary);
		border-radius: var(--radius-lg);
		font-size: var(--text-base);
		color: var(--color-text);
		border: 1px solid transparent;
		transition:
			background 0.2s,
			transform 0.1s;
		width: 100%;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}

	.trigger:active {
		transform: scale(0.98);
		background: var(--color-bg-tertiary);
	}

	.trigger.active {
		background: var(--color-bg);
		border-color: var(--color-primary);
	}

	.icon-wrap {
		transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
		color: var(--color-text-secondary);
	}

	.options-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 6px;
		max-height: 320px;
		overflow-y: auto;
	}

	.option-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 12px;
		border-radius: var(--radius-md);
		text-align: left;
		transition: background 0.15s;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		background: transparent;
		border: none;
		width: 100%;
	}

	.option-item:active {
		background: var(--color-bg-secondary);
	}

	.option-item.selected {
		background: color-mix(in srgb, var(--color-primary) 8%, transparent);
	}

	.option-content {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
		min-width: 0;
	}

	.option-label {
		font-size: var(--text-base);
		color: var(--color-text);
		font-weight: var(--font-normal);
	}

	.option-item.selected .option-label {
		color: var(--color-primary);
		font-weight: var(--font-medium);
	}

	.option-desc {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		line-height: 1.3;
	}

	.check-icon {
		color: var(--color-primary);
		padding-left: 12px;
		display: flex;
		align-items: center;
	}
</style>
