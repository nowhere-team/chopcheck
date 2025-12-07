<script lang="ts">
	import { X } from 'phosphor-svelte'
	import { fade } from 'svelte/transition'

	import { getPlatform } from '$lib/app/context.svelte'
	import { swipeController } from '$lib/navigation/swipe.svelte'

	import Portal from './Portal.svelte'

	interface Props {
		open: boolean
		onclose: () => void
		title?: string
		children?: Snippet // updated type
	}

	import type { Snippet } from 'svelte'

	let { open = $bindable(), onclose, title, children }: Props = $props()
	const platform = getPlatform()

	let sheetRef = $state<HTMLDivElement>()
	let startY = 0
	let currentY = $state(0)
	let isDragging = $state(false)

	function close() {
		/* same logical implementation */
		open = false
		if (onclose) onclose()
		currentY = 0
		platform.haptic.impact('light')
	}

	/* ... dragging logic stays mostly the same ... */

	function handleStart(y: number) {
		startY = y
		isDragging = true
	}

	function handleMove(y: number) {
		if (!isDragging) return
		const delta = y - startY
		if (delta > 0) currentY = delta
		else currentY = delta * 0.2
	}

	function handleEnd() {
		isDragging = false
		if (currentY > 100) close()
		else currentY = 0
	}

	$effect(() => {
		if (open) {
			swipeController.disable() // explicit disable method
			document.body.style.overflow = 'hidden'
		} else {
			swipeController.enable()
			document.body.style.overflow = ''
		}
		return () => {
			swipeController.enable()
			document.body.style.overflow = ''
		}
	})
</script>

{#if open}
	<Portal target="#portal-root">
		<div class="sheet-portal-wrapper">
			<div
				class="backdrop"
				transition:fade={{ duration: 200 }}
				onclick={close}
				role="presentation"
			></div>

			<div
				class="sheet-container"
				bind:this={sheetRef}
				style:transform="translate3d(0, {currentY}px, 0)"
				class:animate={!isDragging}
				ontouchstart={e => handleStart(e.touches[0].clientY)}
				ontouchmove={e => isDragging && handleMove(e.touches[0].clientY)}
				ontouchend={handleEnd}
			>
				<div class="handle-bar">
					<div class="handle"></div>
				</div>

				{#if title}
					<div class="header">
						<h2>{title}</h2>
						<button class="close-btn" onclick={close} aria-label="close">
							<X size={20} />
						</button>
					</div>
				{/if}

				<div class="content">
					{@render children?.()}
				</div>
			</div>
		</div>
	</Portal>
{/if}

<style>
	.sheet-portal-wrapper {
		position: fixed;
		inset: 0;
		z-index: var(--z-modal);
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		pointer-events: auto; /* explicit */
	}

	.backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
	}

	.sheet-container {
		background: var(--color-bg-elevated);
		border-radius: 20px 20px 0 0;
		padding-bottom: calc(var(--safe-bottom) + 20px);
		box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.15);
		display: flex;
		flex-direction: column;
		max-height: 90dvh;
		position: relative;
		z-index: 2;
		/* animation defined in CSS or transition directives */
	}

	.handle-bar {
		padding: 12px 0;
		display: flex;
		justify-content: center;
	}
	.handle {
		width: 32px;
		height: 4px;
		background: var(--color-border);
		border-radius: 2px;
	}
	.header {
		display: flex;
		justify-content: space-between;
		padding: 0 20px 16px;
		align-items: center;
	}
	.header h2 {
		font-size: 18px;
		font-weight: 600;
		margin: 0;
	}
	.close-btn {
		all: unset;
		width: 28px;
		height: 28px;
		background: var(--color-bg-secondary);
		border-radius: 50%;
		display: grid;
		place-items: center;
	}
	.content {
		overflow-y: auto;
		padding: 0 20px;
		overscroll-behavior: contain;
	}
</style>
