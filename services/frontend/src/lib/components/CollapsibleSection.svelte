<script lang="ts">
	import { CaretDown } from 'phosphor-svelte'
	import type { Snippet } from 'svelte'
	import { slide } from 'svelte/transition'

	import { haptic } from '$telegram/haptic'

	interface Props {
		title: string
		count?: number
		expanded?: boolean
		children?: Snippet
	}

	let { title, count, children, expanded = $bindable(true) }: Props = $props()

	function toggle() {
		expanded = !expanded
		haptic.soft()
	}
</script>

<div class="section">
	<div
		class="header"
		role="button"
		tabindex="0"
		aria-expanded={expanded}
		onclick={toggle}
		onkeydown={e => (e.key === 'Enter' || e.key === ' ' ? toggle() : null)}
	>
		<div class="header-content">
			<h2 class="section-title">{title}</h2>
			{#if count !== undefined && count > 0}
				<span class="count">{count}</span>
			{/if}
		</div>
		<div class="icon" class:rotated={expanded}>
			<CaretDown size={25} weight="regular" />
		</div>
	</div>
	{#if expanded}
		<div class="content" transition:slide={{ duration: 200 }}>
			{@render children?.()}
		</div>
	{/if}
</div>

<style>
	.section {
		border-radius: var(--radius-default);
		background: var(--color-bg-page);
	}

	.header {
		all: unset;
		box-sizing: border-box;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-4-m) 0;
		cursor: pointer;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
		transition: background 150ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.header:active {
		transform: scale(0.99);
	}

	.header:focus-visible {
		outline: 2px solid var(--color-border-focus);
		outline-offset: -2px;
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: var(--spacing-3-m);
	}

	.count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 25px;
		height: 25px;
		background: var(--color-button-secondary-bg);
		color: var(--color-text-primary);
		border-radius: 12px;
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-icon-default);
		transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
		flex-shrink: 0;
	}

	.icon.rotated {
		transform: rotate(180deg);
	}

	.content {
		padding: 0 0 var(--spacing-4-m);
	}

	@media (hover: none) {
		.header:active {
			transform: scale(0.98);
		}
	}
</style>
