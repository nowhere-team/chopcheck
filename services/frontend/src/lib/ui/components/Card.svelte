<!-- file: services/frontend/src/lib/ui/components/Card.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		variant?: 'default' | 'elevated' | 'outlined'
		padding?: 'none' | 'sm' | 'md' | 'lg'
		interactive?: boolean
		onclick?: () => void
		children?: Snippet
	}

	const {
		variant = 'default',
		padding = 'md',
		interactive = false,
		onclick,
		children
	}: Props = $props()
</script>

<svelte:element
	this={interactive ? 'button' : 'div'}
	class="card {variant} p-{padding}"
	class:interactive
	type={interactive ? 'button' : undefined}
	{onclick}
>
	{@render children?.()}
</svelte:element>

<style>
	.card {
		width: 100%;
		border-radius: var(--radius-lg);
		transition:
			transform var(--duration-fast) var(--ease-out),
			background var(--duration-fast) var(--ease-out);
	}

	/* variants */
	.default {
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
	}

	.elevated {
		background: var(--color-bg-elevated);
		box-shadow: var(--shadow-md);
	}

	.outlined {
		background: transparent;
		border: 1px solid var(--color-border);
	}

	/* padding */
	.p-none {
		padding: 0;
	}
	.p-sm {
		padding: var(--space-3);
	}
	.p-md {
		padding: var(--space-4);
	}
	.p-lg {
		padding: var(--space-6);
	}

	/* interactive */
	.interactive {
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}

	.interactive:hover {
		background: var(--color-bg-selected);
	}

	.interactive:active {
		transform: scale(0.99);
	}

	@media (hover: none) {
		.interactive:active {
			transform: scale(0.98);
		}
	}
</style>
