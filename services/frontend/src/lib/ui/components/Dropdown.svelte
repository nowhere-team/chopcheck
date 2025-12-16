<script lang="ts">
	import { onClickOutside } from 'runed'
	import type { Snippet } from 'svelte'
	import { tick } from 'svelte'
	import { cubicOut } from 'svelte/easing'
	import { scale } from 'svelte/transition'

	import Portal from '$lib/ui/overlays/Portal.svelte'

	interface Props {
		open?: boolean
		anchor: HTMLElement | undefined
		placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'auto'
		children: Snippet
		onclose?: () => void
		class?: string
	}

	let {
		open = $bindable(false),
		anchor,
		placement = 'auto',
		children,
		onclose,
		class: className = ''
	}: Props = $props()

	let contentRef = $state<HTMLDivElement | undefined>()
	let coords = $state({ top: 0, left: 0, right: 0, minWidth: 0 })
	let effectivePlacement = $state<'bottom' | 'top'>('bottom')
	let horizontalAlign = $state<'start' | 'end'>('start')
	let positioned = $state(false)

	onClickOutside(
		() => contentRef,
		() => {
			if (open) close()
		},
		{ immediate: false }
	)

	function updatePosition() {
		if (!anchor) return

		const rect = anchor.getBoundingClientRect()
		if (rect.width === 0 && rect.height === 0) return

		const viewportHeight = window.innerHeight
		const viewportWidth = window.innerWidth

		const spaceBelow = viewportHeight - rect.bottom
		const spaceAbove = rect.top
		const minRequiredSpace = 220

		let vertical: 'bottom' | 'top' = 'bottom'
		let horizontal: 'start' | 'end' = 'start'

		const prefersTop = placement.startsWith('top')
		const prefersEnd = placement.endsWith('end')

		if (placement === 'auto') {
			vertical = spaceBelow < minRequiredSpace && spaceAbove > spaceBelow ? 'top' : 'bottom'
			horizontal = rect.left > viewportWidth / 2 ? 'end' : 'start'
		} else {
			if (prefersTop) {
				vertical = spaceAbove >= minRequiredSpace ? 'top' : 'bottom'
			} else {
				vertical = spaceBelow >= minRequiredSpace ? 'bottom' : 'top'
			}
			horizontal = prefersEnd ? 'end' : 'start'
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

	$effect(() => {
		if (open) {
			positioned = false
			tick().then(() => {
				updatePosition()
				positioned = true
			})
		} else {
			positioned = false
		}
	})

	function close() {
		open = false
		onclose?.()
	}
</script>

{#if open && positioned}
	<Portal target="#portal-root">
		<div class="dropdown-backdrop {className}" onclick={close} role="presentation"></div>
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

<style>
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
