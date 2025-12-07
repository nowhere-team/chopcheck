<script lang="ts">
	import { CaretDown, Check } from 'phosphor-svelte'
	import { quintOut } from 'svelte/easing'
	import { fade, scale } from 'svelte/transition'

	import { getPlatform } from '$lib/app/context.svelte'

	interface Option {
		value: string
		label: string
	}

	interface Props {
		value: string
		options: Option[]
		label?: string
	}

	let { value = $bindable(), options, label }: Props = $props()
	const platform = getPlatform()

	let isOpen = $state(false)
	let triggerRef: HTMLButtonElement | undefined = $state()
	let coords = $state({ top: 0, left: 0, width: 0 })

	const currentLabel = $derived(options.find(o => o.value === value)?.label || value)

	function updatePosition() {
		if (triggerRef) {
			const rect = triggerRef.getBoundingClientRect()
			coords = {
				top: rect.bottom + 6,
				left: rect.left,
				width: rect.width
			}
		}
	}

	function toggle() {
		if (!isOpen) {
			updatePosition()
			platform.haptic.selection()
			isOpen = true
		} else {
			isOpen = false
		}
	}

	function select(val: string) {
		if (val === value) {
			isOpen = false
			return
		}
		value = val
		isOpen = false
		platform.haptic.impact('light')
	}
</script>

<div class="select-wrapper">
	{#if label}
		<span class="label">{label}</span>
	{/if}

	<button bind:this={triggerRef} class="trigger" class:active={isOpen} onclick={toggle}>
		<span class="value-text">{currentLabel}</span>
		<span class="icon-wrap" style:transform={isOpen ? 'rotate(180deg)' : 'rotate(0)'}>
			<CaretDown size={16} weight="bold" />
		</span>
	</button>

	{#if isOpen}
		<div class="portal-root">
			<div
				class="backdrop"
				onclick={() => (isOpen = false)}
				role="presentation"
				transition:fade={{ duration: 150 }}
			></div>

			<div
				class="dropdown glass-panel"
				style:top="{coords.top}px"
				style:left="{coords.left}px"
				style:width="{coords.width}px"
				transition:scale={{ duration: 200, start: 0.9, opacity: 0, easing: quintOut }}
			>
				{#each options as option (option.value)}
					<button
						class="option-item"
						class:selected={option.value === value}
						onclick={() => select(option.value)}
					>
						<span>{option.label}</span>
						{#if option.value === value}
							<Check size={16} weight="bold" class="check-icon" />
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.select-wrapper {
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: 100%;
		position: relative;
	}

	.label {
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
		margin-left: 4px;
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

	.portal-root {
		position: fixed;
		inset: 0;
		z-index: var(--z-modal);
		pointer-events: auto;
	}

	.backdrop {
		position: absolute;
		inset: 0;
		background: transparent;
	}

	.dropdown {
		position: absolute;
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 6px;

		/* Liquid Glass force logic */
		background-color: var(--glass-bg-secondary);
		backdrop-filter: blur(var(--glass-blur)) saturate(180%);
		-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);

		border: 1px solid var(--glass-border);
		border-radius: var(--radius-lg);
		box-shadow:
			0 10px 30px -10px rgba(0, 0, 0, 0.15),
			0 0 0 1px rgba(0, 0, 0, 0.02);

		transform-origin: top center;
		overflow: hidden;
	}

	.option-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 12px;
		border-radius: var(--radius-md);
		font-size: var(--text-base);
		color: var(--color-text);
		transition: background 0.15s;
		text-align: left;
	}

	.option-item:active {
		background: var(--color-bg-secondary);
		transform: scale(0.98);
	}

	.option-item.selected {
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		font-weight: 500;
	}

	.check-icon {
		color: var(--color-primary);
	}
</style>
