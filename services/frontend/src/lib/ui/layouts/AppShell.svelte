<script lang="ts">
	import type { Snippet } from 'svelte'
	import { onMount } from 'svelte'

	import { getPlatform } from '$lib/app/context.svelte'
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
</script>

<ToastContainer />
<ModalContainer />

<div class="shell" data-platform={platformType}>
	<div class="container">
		<main class="content">
			{@render children?.()}
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
		overflow: hidden;
		position: relative;
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
