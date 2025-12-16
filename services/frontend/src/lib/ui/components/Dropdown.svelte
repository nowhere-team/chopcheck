<script lang="ts">
	import { onClickOutside } from 'runed'
	import type { Snippet } from 'svelte'
	import { cubicOut } from 'svelte/easing'
	import { scale } from 'svelte/transition'

	import { getPlatform } from '$lib/app/context.svelte'
	import Portal from '$lib/ui/overlays/Portal.svelte'

	interface Props {
		open?: boolean
		placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'auto'
		trigger: Snippet
		children: Snippet
		onOpenChange?: (open: boolean) => void
		class?: string
	}

	let {
		open = $bindable(false),
		placement = 'auto',
		trigger,
		children,
		onOpenChange,
		class: className = ''
	}: Props = $props()

	const platform = getPlatform()

	let triggerRef = $state<HTMLDivElement | undefined>()
	let contentRef = $state<HTMLDivElement | undefined>()
	let coords = $state({ top: 0, left: 0, right: 0, minWidth: 0 })
	let effectivePlacement = $state<'bottom' | 'top'>('bottom')
	let horizontalAlign = $state<'start' | 'end'>('start')

	onClickOutside(
		() => contentRef,
		() => {
			if (open) close()
		},
		{ immediate: false }
	)

	function updatePosition() {
		if (!triggerRef) return

		const rect = triggerRef.getBoundingClientRect()
		const viewportHeight = window.innerHeight
		const viewportWidth = window.innerWidth

		const spaceBelow = viewportHeight - rect.bottom
		const spaceAbove = rect.top

		let vertical: 'bottom' | 'top' = 'bottom'
		let horizontal: 'start' | 'end' = 'start'

		if (placement === 'auto') {
			vertical = spaceBelow < 220 && spaceAbove > spaceBelow ? 'top' : 'bottom'
			horizontal = rect.left > viewportWidth / 2 ? 'end' : 'start'
		} else {
			vertical = placement.startsWith('top') ? 'top' : 'bottom'
			horizontal = placement.endsWith('end') ? 'end' : 'start'
		}

		effectivePlacement = vertical
		horizontalAlign = horizontal

		const top = vertical === 'top' ? rect.top - 6 : rect.bottom + 6

		coords = {
			top: Math.round(top),
			left: Math.round(rect.left),
			right: Math.round(viewportWidth - rect.right),
			minWidth: Math.round(rect.width)
		}
	}

	function handleTriggerClick(e: MouseEvent) {
		e.stopPropagation()
		e.preventDefault()

		if (!open) {
			updatePosition()
			platform.haptic.selection()
			open = true
			onOpenChange?.(true)
		} else {
			close()
		}
	}

	function close() {
		open = false
		onOpenChange?.(false)
	}
</script>

<div class="dropdown-host {className}">
	<div
		bind:this={triggerRef}
		class="trigger-wrapper"
		onclick={handleTriggerClick}
		onkeydown={e => e.key === 'Enter' && handleTriggerClick}
		role="button"
		tabindex="0"
	>
		{@render trigger()}
	</div>

	{#if open}
		<Portal target="#portal-root">
			<div class="dropdown-backdrop" onclick={close} role="presentation"></div>
			<div
				bind:this={contentRef}
				class="dropdown-content"
				class:from-top={effectivePlacement === 'top'}
				class:align-end={horizontalAlign === 'end'}
				style:top="{coords.top}px"
				style:left={horizontalAlign === 'start' ? `${coords.left}px` : 'auto'}
				style:right={horizontalAlign === 'end' ? `${coords.right}px` : 'auto'}
				style:min-width="{coords.minWidth}px"
				transition:scale={{
					duration: 150,
					easing: cubicOut,
					start: 0.95,
					opacity: 0
				}}
			>
				{@render children()}
			</div>
		</Portal>
	{/if}
</div>

<style>
	.dropdown-host {
		display: contents;
	}

	.trigger-wrapper {
		display: contents;
	}

	.dropdown-backdrop {
		position: fixed;
		inset: 0;
		z-index: calc(var(--z-modal) + 49);
	}

	.dropdown-content {
		position: fixed;
		z-index: calc(var(--z-modal) + 50);
		background: var(--color-bg-elevated, var(--color-bg));
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow:
			0 10px 30px -10px rgba(0, 0, 0, 0.2),
			0 4px 12px -4px rgba(0, 0, 0, 0.1);
		transform-origin: top left;
		overflow: hidden;
		width: max-content;
		max-width: min(280px, 90vw);
	}

	.dropdown-content.from-top {
		transform-origin: bottom left;
		transform: translateY(-100%);
	}

	.dropdown-content.align-end {
		transform-origin: top right;
	}

	.dropdown-content.from-top.align-end {
		transform-origin: bottom right;
	}
</style>
