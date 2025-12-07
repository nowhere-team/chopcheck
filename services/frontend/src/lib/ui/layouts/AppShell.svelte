<script lang="ts">
	import type { Snippet } from 'svelte'

	import { page } from '$app/state'
	import { getPlatform } from '$lib/app/context.svelte'
	import { swipeController } from '$lib/navigation/swipe.svelte'

	interface Props {
		navbar?: Snippet
		children?: Snippet
	}

	const { navbar, children }: Props = $props()
	const platform = getPlatform()

	// init global swipe controller with platform access
	$effect(() => {
		swipeController.init(platform)
		return () => swipeController.destroy()
	})

	// sync current path for navigation logic
	$effect(() => {
		swipeController.setPath(page.url.pathname)
	})
</script>

<div class="app-shell">
	<main class="content" style="view-transition-name: page">
		{@render children?.()}
	</main>

	{#if navbar}
		<nav class="navbar" style="view-transition-name: navbar">
			{@render navbar()}
		</nav>
	{/if}
</div>

<style>
	.app-shell {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
		padding-top: var(--safe-top);
		padding-left: max(var(--safe-left), var(--space-4));
		padding-right: max(var(--safe-right), var(--space-4));
	}

	.content {
		flex: 1;
		padding-bottom: calc(64px + var(--safe-bottom) + var(--space-2));
	}

	.navbar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: calc(64px + var(--safe-bottom));
		padding-bottom: var(--safe-bottom);
		background: var(--color-bg-elevated);
		border-top: 1px solid var(--color-border);
		z-index: var(--z-sticky);
	}
</style>
