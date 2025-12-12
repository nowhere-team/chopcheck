<!--suppress TypeScriptExplicitMemberType -->
<script lang="ts">
	import { X } from 'phosphor-svelte'
	import type { Snippet } from 'svelte'
	import { cubicOut } from 'svelte/easing'
	import { fade, fly } from 'svelte/transition'

	import { getPlatform } from '$lib/app/context.svelte'
	import { swipeController } from '$lib/navigation/swipe.svelte'

	import Portal from './Portal.svelte'

	interface Props {
		open: boolean
		onclose?: () => void
		title?: string
		children?: Snippet
	}

	let { open = $bindable(), onclose, title, children }: Props = $props()
	const platform = getPlatform()

	let sheetRef = $state<HTMLDivElement>()
	let startY = 0
	let currentY = $state(0)
	let isDragging = $state(false)

	function close() {
		platform.haptic.impact('light')
		currentY = 0
		open = false
		onclose?.()
	}

	function handleStart(y: number) {
		startY = y
		isDragging = true
	}

	function handleMove(y: number) {
		if (!isDragging) return
		const delta = y - startY

		if (delta > 0) {
			currentY = delta * 0.7
		} else {
			currentY = -Math.log(Math.abs(delta) + 1) * 2
		}
	}

	function handleEnd() {
		isDragging = false
		if (currentY > 120) {
			close()
		} else {
			currentY = 0
		}
	}

	$effect(() => {
		if (open) {
			swipeController.disable()
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
				transition:fade={{ duration: 250 }}
				onclick={close}
				role="presentation"
			></div>

			<!--suppress HtmlUnknownAttribute -->
			<div
				class="sheet-container"
				bind:this={sheetRef}
				transition:fly={{ y: '100%', duration: 300, opacity: 1, easing: cubicOut }}
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
		pointer-events: auto;
	}

	.backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
	}

	.sheet-container {
		background: var(--color-bg);
		border-radius: 20px 20px 0 0;
		padding-bottom: calc(var(--safe-bottom) + var(--space-8));
		box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.15);
		display: flex;
		flex-direction: column;
		max-height: 90dvh;
		position: relative;
		z-index: 2;
		will-change: transform;
	}

	.sheet-container::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		height: 50vh;
		background: var(--color-bg);
	}

	.animate {
		transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1);
	}

	.handle-bar {
		padding: 12px 0;
		display: flex;
		justify-content: center;
		flex-shrink: 0;
	}

	.handle {
		width: 40px;
		height: 5px;
		background: var(--color-border-subtle);
		background-color: var(--color-bg-tertiary);
		border-radius: 10px;
	}

	.header {
		display: flex;
		justify-content: space-between;
		padding: 0 20px 16px;
		align-items: center;
		flex-shrink: 0;
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
