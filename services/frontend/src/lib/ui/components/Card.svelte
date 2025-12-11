<!--suppress CssUnusedSymbol -->
<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		variant?: 'default' | 'elevated' | 'outlined' | 'ghost'
		padding?: 'none' | 'sm' | 'md' | 'lg'
		interactive?: boolean
		onclick?: () => void
		children?: Snippet
		class?: string // allow external styling override
	}

	const {
		variant = 'default',
		padding = 'md',
		interactive = false,
		onclick,
		children,
		class: className
	}: Props = $props()

	function onKeydown(e: KeyboardEvent) {
		if (interactive && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault()
			onclick?.()
		}
	}
</script>

<svelte:element
	this={interactive ? 'button' : 'div'}
	class="card {variant} p-{padding} {className || ''}"
	class:interactive
	role={interactive ? 'button' : undefined}
	tabindex={interactive ? 0 : undefined}
	{onclick}
	onkeydown={interactive ? onKeydown : undefined}
>
	{@render children?.()}
</svelte:element>

<style>
	.card {
		width: 100%;
		border-radius: var(--radius-lg);
		transition: all var(--duration-normal) var(--ease-out);
		text-align: left;
		position: relative;
		overflow: hidden; /* for border-radius clip */
	}

	/* variants using our new subtle borders and backgrounds */
	.default {
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
	}

	.elevated {
		background: var(--color-bg-elevated);
		box-shadow: var(--shadow-sm);
		border: 1px solid transparent;
	}

	.outlined {
		background: transparent;
		border: 1px solid var(--color-border);
	}

	.ghost {
		background: transparent;
		border: 1px solid transparent;
	}

	/* padding */
	.p-none {
		padding: 0;
	}
	.p-sm {
		padding: var(--space-3);
	}
	.p-md {
		padding: var(--space-3) var(--space-4);
	}
	.p-lg {
		padding: var(--space-6);
	}

	.interactive {
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}

	.interactive:hover {
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
		border-color: var(--color-border-subtle);
	}

	.interactive:active {
		transform: translateY(0) scale(0.99);
		background: var(--color-bg-secondary);
	}
</style>
