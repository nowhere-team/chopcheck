<script lang="ts">
	import type { Snippet } from 'svelte'

	import SwipeContainer from '$lib/ui/layouts/SwipeContainer.svelte'

	interface Props {
		navbar?: Snippet
		children?: Snippet
	}

	const { navbar, children }: Props = $props()
</script>

<div class="app-shell">
	<SwipeContainer>
		<main class="content" style="view-transition-name: page">
			{@render children?.()}
		</main>
	</SwipeContainer>

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
