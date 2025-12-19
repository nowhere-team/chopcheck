<script lang="ts">
	import type { Snippet } from 'svelte'
	import { onMount } from 'svelte'

	import { page } from '$app/state'
	import { getPlatform } from '$lib/app/context.svelte'
	import { swipeController } from '$lib/navigation/swipe.svelte'
	import { connectionMonitor } from '$lib/services/connection.svelte'
	import { ModalContainer } from '$lib/ui/features/modals'
	import { ToastContainer } from '$lib/ui/features/toasts'

	interface Props {
		navbar?: Snippet
		children?: Snippet
	}

	const { navbar, children }: Props = $props()
	const platform = getPlatform()

	const platformType = $derived(platform.type)

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
<ModalContainer />

<div class="shell" data-platform={platformType}>
	<div class="container">
		<main class="content">
			<div class="content-viewport">
				{@render children?.()}
			</div>
		</main>

		{#if navbar}
			{@render navbar()}
		{/if}
	</div>
</div>

<div id="portal-root"></div>

<!--suppress CssUnusedSymbol -->
<style>
	:global(:root) {
		--safe-top: 0px;
		--safe-bottom: 0px;
		--safe-left: 0px;
		--safe-right: 0px;
	}

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
		position: relative;
	}

	.content::-webkit-scrollbar {
		display: none;
	}

	.content-viewport {
		min-height: 100%;
		display: flex;
		flex-direction: column;
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
