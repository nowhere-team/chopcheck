<script lang="ts">
	import { X } from 'phosphor-svelte'
	import type { Snippet } from 'svelte'
	import { fade, fly } from 'svelte/transition'

	import { getSwipeContext } from '$lib/contexts/swipe.svelte'
	import { haptic } from '$telegram/haptic'

	interface Props {
		open?: boolean
		onclose: () => void
		title?: string
		subtitle?: string
		height?: number
		children?: Snippet
	}

	let {
		open = $bindable(false),
		onclose,
		title,
		subtitle,
		height = 60,
		children
	}: Props = $props()

	const swipeContext = getSwipeContext()

	let sheet: HTMLDivElement | undefined = $state()
	let content: HTMLDivElement | undefined = $state()
	let backdrop: HTMLDivElement | undefined = $state()
	let startY = 0
	let currentY = 0
	let isDragging = false
	let isMouseDrag = false

	const heightPercent = $derived(`${height}%`)

	function close() {
		haptic.soft()
		open = false
		onclose()
	}

	function canStartDrag(): boolean {
		if (!content) return true
		return content.scrollTop === 0
	}

	function handleDragStart(clientY: number, isMouse = false) {
		if (!canStartDrag()) return

		startY = clientY
		isDragging = true
		isMouseDrag = isMouse

		if (sheet) {
			sheet.style.willChange = 'transform'
		}
	}

	function handleDragMove(clientY: number) {
		if (!isDragging || !sheet) return

		currentY = clientY
		const diff = currentY - startY

		if (diff > 0) {
			const resistance = 1 - Math.min(diff / 500, 0.5)
			sheet.style.transform = `translateY(${diff * resistance}px)`
			sheet.style.transition = 'none'
		}
	}

	function handleDragEnd() {
		if (!isDragging || !sheet) return

		isDragging = false
		isMouseDrag = false
		const diff = currentY - startY

		sheet.style.willChange = 'auto'
		sheet.style.transition = 'transform 200ms ease-out'

		if (diff > 100) {
			close()
		} else {
			sheet.style.transform = 'translateY(0)'
		}
	}

	function handleTouchStart(e: TouchEvent) {
		handleDragStart(e.touches[0].clientY)
	}

	function handleTouchMove(e: TouchEvent) {
		if (isDragging) {
			e.preventDefault()
		}
		handleDragMove(e.touches[0].clientY)
	}

	function handleTouchEnd() {
		handleDragEnd()
	}

	function handleMouseDown(e: MouseEvent) {
		if (
			e.target instanceof HTMLElement &&
			(e.target.classList.contains('handle') ||
				e.target.classList.contains('header') ||
				e.target.closest('.handle') ||
				e.target.closest('.header'))
		) {
			e.preventDefault()
			handleDragStart(e.clientY, true)
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (isMouseDrag) {
			e.preventDefault()
		}
		handleDragMove(e.clientY)
	}

	function handleMouseUp() {
		if (isMouseDrag) {
			handleDragEnd()
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === backdrop) {
			close()
		}
	}

	function handleBackdropKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close()
		}
	}

	$effect(() => {
		if (swipeContext) {
			swipeContext.enabled = !open
		}
	})

	$effect(() => {
		if (open) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = ''
		}
	})

	$effect(() => {
		if (!open) return

		const cleanup = [
			() => window.removeEventListener('mousemove', handleMouseMove),
			() => window.removeEventListener('mouseup', handleMouseUp)
		]

		window.addEventListener('mousemove', handleMouseMove)
		window.addEventListener('mouseup', handleMouseUp)

		return () => cleanup.forEach(fn => fn())
	})
</script>

{#if open}
	<div
		class="backdrop"
		bind:this={backdrop}
		onclick={handleBackdropClick}
		onkeydown={handleBackdropKeydown}
		role="button"
		tabindex="-1"
		transition:fade={{ duration: 200 }}
	>
		<!--suppress HtmlUnknownAttribute -->
		<div
			class="sheet"
			bind:this={sheet}
			style:height={heightPercent}
			ontouchstart={handleTouchStart}
			ontouchmove={handleTouchMove}
			ontouchend={handleTouchEnd}
			onmousedown={handleMouseDown}
			role="dialog"
			tabindex="-1"
			transition:fly={{ y: '100%', duration: 300, opacity: 1 }}
		>
			<div class="handle"></div>

			{#if title}
				<div class="header">
					<div class="header-content">
						<h2>{title}</h2>
						{#if subtitle}
							<p class="subtitle">{subtitle}</p>
						{/if}
					</div>
					<button class="close-btn" onclick={close} type="button">
						<X size={24} />
					</button>
				</div>
			{/if}

			<div class="content" bind:this={content}>
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1000;
		display: flex;
		align-items: flex-end;
		pointer-events: all;
	}

	.sheet {
		width: 100%;
		background: var(--color-bg-surface);
		padding-bottom: calc(64px + max(var(--tg-inset-bottom), 8px));
		border-radius: var(--radius-default) var(--radius-default) 0 0;
		display: flex;
		flex-direction: column;
		transition: transform 200ms ease-out;
		max-height: 90vh;
		position: relative;
		transform: translate3d(0, 0, 0);
		backface-visibility: hidden;
	}

	.handle {
		width: 36px;
		height: 4px;
		background: var(--color-border-default);
		border-radius: 2px;
		margin: var(--spacing-3-m) auto var(--spacing-2-m);
		flex-shrink: 0;
		cursor: grab;
		user-select: none;
	}

	.handle:active {
		cursor: grabbing;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-2-m) var(--spacing-4-m) var(--spacing-4-m);
		flex-shrink: 0;
		cursor: grab;
		user-select: none;
		gap: var(--spacing-3-m);
	}

	.header:active {
		cursor: grabbing;
	}

	.header-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-1-m);
	}

	.header h2 {
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		user-select: none;
	}

	.subtitle {
		font-size: var(--text-base);
		color: var(--color-text-secondary);
		user-select: none;
	}

	.close-btn {
		all: unset;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: var(--color-icon-default);
		transition: color 150ms;
		-webkit-tap-highlight-color: transparent;
		border-radius: var(--radius-default);
		padding: var(--spacing-2-m);
		flex-shrink: 0;
	}

	.close-btn:active {
		transform: scale(0.95);
	}

	.content {
		flex: 1;
		overflow-y: auto;
		padding: 0 var(--spacing-4-m);
		padding-bottom: var(--spacing-4-m);
		overscroll-behavior: contain;
	}
</style>
