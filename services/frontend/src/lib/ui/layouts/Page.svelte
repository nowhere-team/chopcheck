<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		title?: string
		centered?: boolean
		navPadding?: boolean
		safeTop?: boolean | number
		children?: Snippet
	}

	const { title, centered = false, navPadding = false, safeTop = 0.8, children }: Props = $props()
	const topMult = $derived(+(Number.isInteger(safeTop) ? safeTop : 0.8))
</script>

<div class="page" class:centered class:with-nav={navPadding} style:--pt-mult={topMult}>
	{#if title}
		<header class="header">
			<h1>{title}</h1>
		</header>
	{/if}

	<div class="page-body">
		{@render children?.()}
	</div>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		min-height: 100dvh;
		padding: var(--space-4) 0;
		padding-top: calc(16px + (var(--safe-top) * var(--pt-mult)));
		padding-right: max(var(--safe-right), 16px);
		padding-bottom: calc(var(--safe-bottom) + 16px);
		padding-left: max(var(--safe-left), 16px);
	}

	.page.centered .page-body {
		justify-content: center;
		align-items: center;
		text-align: center;
	}

	.header h1 {
		font-size: var(--text-xl);
		font-weight: var(--font-semibold);
		text-align: center;
	}

	.page-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		width: 100%;
		flex-grow: 1;
	}

	.with-nav {
		padding-bottom: 150px;
	}
</style>
