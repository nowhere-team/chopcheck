<script lang="ts">
	import type { Snippet } from 'svelte'
	import { onMount } from 'svelte'

	import { page } from '$app/state'
	import { getPlatform } from '$lib/app/context.svelte'
	import { swipeController } from '$lib/navigation/swipe.svelte'
	import { connectionMonitor } from '$lib/services/connection.svelte'
	import { ToastContainer } from '$lib/ui/features/toasts'

	interface Props {
		navbar?: Snippet
		children?: Snippet
	}

	const { navbar, children }: Props = $props()
	const platform = getPlatform()

	onMount(() => {
		connectionMonitor.init()
		return () => connectionMonitor.destroy()
	})

	$effect(() => {
		swipeController.init(platform)
		return () => swipeController.destroy()
	})

	$effect(() => swipeController.setPath(page.url.pathname))
</script>

<ToastContainer />

<div class="shell">
	<div class="container">
		<main class="content">
			<div class="content-inner">
				{@render children?.()}
			</div>
		</main>

		{#if navbar}
			{@render navbar()}
		{/if}
	</div>
</div>

<div id="portal-root"></div>

<style>
	.shell {
		min-height: 100dvh;
		display: flex;
		justify-content: center;
		background: var(--color-bg);
		overflow: hidden;
	}

	.container {
		width: 100%;
		max-width: 600px;
		position: relative;
		display: flex;
		flex-direction: column;
		height: 100dvh;
		background: var(--color-bg);
	}

	.content {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		overscroll-behavior-y: contain;
		touch-action: pan-y;
		scrollbar-width: none;
		-ms-overflow-style: none;
		view-transition-name: page;
	}

	.content::-webkit-scrollbar {
		display: none;
	}

	.content-inner {
		padding: var(--safe-top) max(var(--safe-right), 16px) calc(90px + var(--safe-bottom))
			max(var(--safe-left), 16px);
		min-height: 100%;
	}

	#portal-root {
		display: contents;
	}

	#portal-root:empty {
		display: none;
	}

	:global(.portal-instance) {
		position: fixed;
		inset: 0;
		z-index: 9999;
		pointer-events: none;
	}

	:global(.portal-instance > *) {
		pointer-events: auto;
	}

	:global(html) {
		background: var(--color-bg);
		overscroll-behavior: none;
	}
</style>
