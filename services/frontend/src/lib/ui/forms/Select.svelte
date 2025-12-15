<script lang="ts">
	import { CaretDown, Check } from 'phosphor-svelte'
	import { onClickOutside } from 'runed'
	import { cubicOut } from 'svelte/easing'
	import { scale } from 'svelte/transition'

	import { getPlatform } from '$lib/app/context.svelte.js'
	import Label from '$lib/ui/components/Label.svelte'
	import Portal from '$lib/ui/overlays/Portal.svelte'

	interface Option {
		value: string
		label: string
		description?: string
	}

	interface Props {
		value: string
		options: Option[]
		label?: string
	}

	let { value = $bindable(), options, label }: Props = $props()
	const platform = getPlatform()

	let isOpen = $state(false)
	let triggerRef = $state<HTMLButtonElement | undefined>()
	let dropdownRef = $state<HTMLDivElement | undefined>()
	let coords = $state({ top: 0, left: 0, width: 0 })
	let placement = $state<'bottom' | 'top'>('bottom')

	const currentLabel = $derived(options.find(o => o.value === value)?.label || value)

	onClickOutside(
		() => dropdownRef,
		() => {
			if (isOpen) isOpen = false
		},
		{
			immediate: false,
			detectIframe: false
		}
	)

	function updatePosition() {
		if (!triggerRef) return

		const rect = triggerRef.getBoundingClientRect()
		const viewportHeight = window.innerHeight
		const estimatedHeight = Math.min(options.length * 60 + 12, 320)
		const spaceBelow = viewportHeight - rect.bottom
		const spaceAbove = rect.top

		// subpixel render fix
		if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
			placement = 'top'
			coords = {
				top: Math.round(rect.top - 6),
				left: Math.round(rect.left),
				width: Math.round(rect.width)
			}
		} else {
			placement = 'bottom'
			coords = {
				top: Math.round(rect.bottom + 6),
				left: Math.round(rect.left),
				width: Math.round(rect.width)
			}
		}
	}

	function toggle(e: MouseEvent) {
		e.stopPropagation()
		e.preventDefault()

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
		<Label>{label}</Label>
	{/if}

	<button
		type="button"
		bind:this={triggerRef}
		class="trigger"
		class:active={isOpen}
		onclick={toggle}
	>
		<span class="value-text">{currentLabel}</span>
		<span class="icon-wrap" style:transform={isOpen ? 'rotate(180deg)' : 'rotate(0)'}>
			<CaretDown size={16} weight="bold" />
		</span>
	</button>

	{#if isOpen}
		<Portal target="#portal-root">
			<div class="select-portal-wrapper">
				<div
					bind:this={dropdownRef}
					class="dropdown"
					class:from-top={placement === 'top'}
					style:top="{coords.top}px"
					style:left="{coords.left}px"
					style:width="{coords.width}px"
					transition:scale={{
						duration: 150,
						easing: cubicOut,
						start: 0.95,
						opacity: 0
					}}
				>
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

	.select-portal-wrapper {
		position: fixed;
		inset: 0;
		z-index: calc(var(--z-modal) + 100);
		pointer-events: none;
	}

	.dropdown {
		position: absolute;
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 6px;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow:
			0 10px 30px -10px rgba(0, 0, 0, 0.2),
			0 4px 12px -4px rgba(0, 0, 0, 0.1);
		transform-origin: top center;
		overflow: hidden;
		max-height: 320px;
		overflow-y: auto;
		pointer-events: auto;
		isolation: isolate;
		will-change: transform, opacity;
	}

	.dropdown.from-top {
		transform-origin: bottom center;
		transform: translateY(-100%);
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
