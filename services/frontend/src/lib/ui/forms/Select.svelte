<script lang="ts">
	import { CaretDown, Check } from 'phosphor-svelte'
	import { quintOut } from 'svelte/easing'
	import { fade, fly } from 'svelte/transition'

	import { getPlatform } from '$lib/app/context.svelte.js'
	import Label from '$lib/ui/components/Label.svelte'
	import Portal from '$lib/ui/overlays/Portal.svelte'

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
	let dropdownRef: HTMLDivElement | undefined = $state()
	let coords = $state({ top: 0, left: 0, width: 0 })
	let placement = $state<'bottom' | 'top'>('bottom')

	const currentLabel = $derived(options.find(o => o.value === value)?.label || value)

	function updatePosition() {
		if (!triggerRef) return

		const rect = triggerRef.getBoundingClientRect()
		const viewportHeight = window.innerHeight
		const spaceBelow = viewportHeight - rect.bottom
		const spaceAbove = rect.top
		const dropdownHeight = Math.min(options.length * 44 + 12, 300) // approximate height

		// decide placement based on available space
		if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
			placement = 'top'
			coords = {
				top: rect.top - dropdownHeight - 6,
				left: rect.left,
				width: rect.width
			}
		} else {
			placement = 'bottom'
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

	function handleWindowClick(e: MouseEvent) {
		if (!isOpen) return
		if (
			dropdownRef &&
			!dropdownRef.contains(e.target as Node) &&
			triggerRef &&
			!triggerRef.contains(e.target as Node)
		) {
			isOpen = false
		}
	}
</script>

<!-- Use window click listener instead of a backdrop div to avoid compositing issues -->
<svelte:window onclick={handleWindowClick} />

<div class="select-wrapper">
	{#if label}
		<Label>{label}</Label>
	{/if}

	<button bind:this={triggerRef} class="trigger" class:active={isOpen} onclick={toggle}>
		<span class="value-text">{currentLabel}</span>
		<span class="icon-wrap" style:transform={isOpen ? 'rotate(180deg)' : 'rotate(0)'}>
			<CaretDown size={16} weight="bold" />
		</span>
	</button>

	{#if isOpen}
		<Portal target="#portal-root">
			<!-- Wrapper has no pointer events so clicks pass through to window listener -->
			<div class="select-portal-wrapper">
				<div
					bind:this={dropdownRef}
					class="dropdown"
					class:from-top={placement === 'top'}
					style:top="{coords.top}px"
					style:left="{coords.left}px"
					style:width="{coords.width}px"
					in:fly={{
						y: placement === 'top' ? 10 : -10,
						duration: 180,
						easing: quintOut
					}}
					out:fade={{ duration: 100 }}
				>
					{#each options as option (option.value)}
						<button
							class="option-item"
							class:selected={option.value === value}
							onclick={() => select(option.value)}
						>
							<span>{option.label}</span>
							{#if option.value === value}
								<Check size={16} weight="bold" />
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</Portal>
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

	.select-portal-wrapper {
		position: fixed;
		inset: 0;
		z-index: calc(var(--z-modal) + 100);
		pointer-events: none; /* Crucial: let clicks pass through to window */
	}

	.dropdown {
		position: absolute;
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 6px;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow:
			0 10px 30px -10px rgba(0, 0, 0, 0.2),
			0 4px 12px -4px rgba(0, 0, 0, 0.1);
		transform-origin: top center;
		overflow: hidden;
		max-height: 300px;
		overflow-y: auto;
		pointer-events: auto; /* Re-enable pointer events for the menu itself */
	}

	.dropdown.from-top {
		transform-origin: bottom center;
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

	.option-item.selected :global(svg) {
		color: var(--color-primary);
	}
</style>
