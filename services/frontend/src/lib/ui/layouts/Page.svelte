<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		title?: string
		centered?: boolean
		children?: Snippet
	}

	const { title, centered = false, children }: Props = $props()
</script>

<div class="page" class:centered>
	{#if title}
		<header class="header">
			<h1>{title}</h1>
		</header>
	{/if}

	<div class="body">
		{@render children?.()}
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		padding: var(--space-4) 0;
	}

	.centered {
		align-items: center;
		text-align: center;
	}

	.header h1 {
		font-size: var(--text-xl);
		font-weight: var(--font-semibold);
		text-align: center;
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		width: 100%;
	}
</style>
