<script lang="ts">
	import { CaretDown } from 'phosphor-svelte'
	import type { Snippet } from 'svelte'
	import { slide } from 'svelte/transition'

	import { getPlatform } from '$lib/app/context.svelte'

	interface Props {
		title: string
		count?: number
		expanded?: boolean
		children?: Snippet
	}

	let { title, count, expanded = $bindable(true), children }: Props = $props()

	const platform = getPlatform()

	function toggle() {
		expanded = !expanded
		platform.haptic.selection()
	}
</script>

<section class="collapsible">
	<button class="header" onclick={toggle} aria-expanded={expanded} type="button">
		<!--suppress HtmlUnknownTag -->
		<div class="title-row">
			<h2 class="title">{title}</h2>
			{#if count !== undefined && count > 0}
				<span class="badge">{count}</span>
			{/if}
		</div>

		<span class="caret" class:rotated={expanded}>
			<CaretDown size={20} weight="bold" />
		</span>
	</button>

	{#if expanded}
		<div class="content" transition:slide={{ duration: 200 }}>
			{@render children?.()}
		</div>
	{/if}
</section>

<style>
	.collapsible {
		display: flex;
		flex-direction: column;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3) 0;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}

	.header:active {
		opacity: 0.7;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.title {
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		color: var(--color-text);
		margin: 0;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 22px;
		height: 22px;
		padding: 0 6px;
		background: var(--color-bg-tertiary);
		border-radius: 11px;
		font-size: var(--text-xs);
		font-weight: var(--font-semibold);
		color: var(--color-text-secondary);
	}

	.caret {
		display: flex;
		color: var(--color-text-tertiary);
		transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		transform: rotate(-90deg);
	}

	.caret.rotated {
		transform: rotate(0deg);
	}

	.content {
		padding-bottom: var(--space-2);
	}
</style>
