<script lang="ts">
	import type { Component, Snippet } from 'svelte'
	import { getContext } from 'svelte'
	import type { HTMLButtonAttributes } from 'svelte/elements'

	import type { Platform } from '$lib/platform/types'

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
	type Size = 'sm' | 'md' | 'lg'

	interface Props extends HTMLButtonAttributes {
		variant?: Variant
		size?: Size
		loading?: boolean
		icon?: Component
		iconSize?: number
		children?: Snippet
		'aria-label'?: string
	}

	const {
		variant = 'primary',
		size = 'md',
		loading = false,
		disabled = false,
		icon: IconComponent,
		iconSize = 20,
		children,
		onclick,
		class: className,
		'aria-label': ariaLabel,
		...rest
	}: Props = $props()

	const platform = getContext<Platform>(Symbol.for('platform'))

	function handleClick(e: MouseEvent) {
		if (loading || disabled) {
			e.preventDefault()
			e.stopPropagation()
			return
		}

		platform?.haptic.impact('light')

		if (onclick) {
			;(onclick as (e: MouseEvent) => void)(e)
		}
	}

	const computedAriaLabel = $derived(ariaLabel || (children ? undefined : 'button'))
</script>

<button
	class="button {variant} {size} {className || ''}"
	class:loading
	class:icon-only={IconComponent && !children}
	disabled={disabled || loading}
	onclick={handleClick}
	aria-label={computedAriaLabel}
	aria-busy={loading}
	{...rest}
>
	{#if loading}
		<span class="spinner" aria-hidden="true"></span>
	{:else}
		{#if IconComponent}
			<span class="icon" aria-hidden="true">
				<IconComponent size={iconSize} />
			</span>
		{/if}

		{#if children}
			<span class="label">{@render children()}</span>
		{/if}
	{/if}
</button>

<style>
	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		font-weight: var(--font-medium);
		border-radius: var(--radius-md);
		cursor: pointer;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
		transition:
			transform var(--duration-fast) var(--ease-out),
			opacity var(--duration-fast) var(--ease-out),
			background var(--duration-fast) var(--ease-out);

		/* reset default border style */
		border: 1px solid transparent;
	}

	/* sizes */
	.sm {
		height: 36px;
		padding: 0 var(--space-3);
		font-size: var(--text-sm);
	}

	.md {
		height: 44px;
		padding: 0 var(--space-4);
		font-size: var(--text-base);
	}

	.lg {
		height: 52px;
		padding: 0 var(--space-6);
		font-size: var(--text-base);
	}

	.icon-only.sm {
		width: 36px;
		padding: 0;
	}
	.icon-only.md {
		width: 44px;
		padding: 0;
	}
	.icon-only.lg {
		width: 52px;
		padding: 0;
	}

	/* variants */
	.primary {
		background: var(--color-primary);
		color: var(--color-primary-text);
	}

	.secondary {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
	}

	.ghost {
		background: transparent;
		color: var(--color-text);
	}

	.danger {
		background: color-mix(in srgb, var(--color-error) 15%, transparent);
		color: var(--color-error);
	}

	/* states */
	.button:hover:not(:disabled) {
		opacity: 0.9;
	}

	.button:active:not(:disabled) {
		transform: scale(0.97);
	}

	.button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.loading {
		pointer-events: none;
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.label {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.spinner {
		width: 18px;
		height: 18px;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
