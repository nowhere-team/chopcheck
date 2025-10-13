<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLButtonAttributes } from 'svelte/elements'

	interface Props {
		variant?: 'default' | 'secondary' | 'active'
		padding?: 'none' | 'sm' | 'md' | 'lg'
		interactive?: boolean
		onclick?: (e: MouseEvent) => void
		children?: Snippet
	}

	const {
		variant = 'default',
		padding = 'md',
		interactive = false,
		onclick,
		children,
		...rest
	}: HTMLButtonAttributes & Props = $props()
</script>

<svelte:element
	this={interactive ? 'button' : 'div'}
	class="box"
	class:default={variant === 'default'}
	class:secondary={variant === 'secondary'}
	class:active={variant === 'active'}
	class:interactive
	class:p-none={padding === 'none'}
	class:p-sm={padding === 'sm'}
	class:p-md={padding === 'md'}
	class:p-lg={padding === 'lg'}
	type={interactive ? 'button' : undefined}
	{onclick}
	{...rest}
>
	{@render children?.()}
</svelte:element>

<!--suppress CssUnusedSymbol -->
<style>
	.box {
		width: 100%;
		color: var(--color-text-primary);
		border-radius: var(--radius-default);
		transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* variants */
	.box.default {
		background: var(--color-bg-surface);
		border: 1px solid var(--color-border-default);
	}

	.box.secondary {
		background: var(--color-bg-surface-secondary);
		border: 1px solid var(--color-border-subtle);
	}

	.box.active {
		background: var(--color-bg-surface-selected);
		border: 1px solid var(--color-button-primary-bg);
	}

	/* padding */
	.box.p-none {
		padding: 0;
	}

	.box.p-sm {
		padding: var(--spacing-3-m);
	}

	.box.p-md {
		padding: var(--spacing-4-m);
	}

	.box.p-lg {
		padding: var(--spacing-6-m);
	}

	/* interactive */
	.box.interactive {
		cursor: pointer;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}

	.box.interactive:hover {
		background: var(--color-bg-surface-selected);
	}

	.box.interactive:active {
		transform: scale(0.99);
	}

	.box.interactive.secondary:hover {
		background: var(--color-bg-surface);
	}

	.box.interactive.active:hover {
		opacity: 0.95;
	}

	/* touch improvements */
	@media (hover: none) {
		.box.interactive:active {
			transform: scale(0.98);
		}
	}
</style>
