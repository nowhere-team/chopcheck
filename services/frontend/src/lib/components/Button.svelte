<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLButtonAttributes } from 'svelte/elements'

	import { haptic } from '$telegram/haptic'

	interface Props {
		variant?: 'primary' | 'secondary'
		size?: 'sm' | 'md' | 'lg'
		disabled?: boolean
		loading?: boolean
		hideTextOnLoading?: boolean
		type?: 'button' | 'submit' | 'reset'
		iconLeft?: Snippet
		iconRight?: Snippet
		onclick?: (e: MouseEvent) => unknown
	}

	const {
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		hideTextOnLoading = false,
		type = 'button',
		iconLeft,
		iconRight,
		onclick,
		children,
		...rest
	}: HTMLButtonAttributes & Props = $props()

	const isDisabled = $derived(disabled || loading)
	const showText = $derived(!loading || !hideTextOnLoading)

	function handleClick(e: MouseEvent) {
		haptic.medium()
		onclick?.(e)
	}
</script>

<button
	class="btn"
	class:primary={variant === 'primary'}
	class:secondary={variant === 'secondary'}
	class:sm={size === 'sm'}
	class:md={size === 'md'}
	class:lg={size === 'lg'}
	class:disabled={isDisabled}
	disabled={isDisabled}
	onclick={handleClick}
	{type}
	{...rest}
>
	{#if loading && hideTextOnLoading}
		<span class="spinner-centered">
			<span class="spinner"></span>
		</span>
	{:else}
		{#if loading && !hideTextOnLoading}
			<span class="spinner"></span>
		{:else if iconLeft}
			{@render iconLeft()}
		{/if}

		{#if showText}
			<span class="text">
				{@render children?.()}
			</span>
		{/if}

		{#if iconRight && !loading}
			{@render iconRight()}
		{/if}
	{/if}
</button>

<style>
	.btn {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-2-m);
		font-weight: var(--font-medium);
		border-radius: var(--radius-default);
		transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
		line-height: 1;
		border: none;
	}

	.btn:active:not(.disabled) {
		transform: scale(0.98);
	}

	/* sizes */
	.btn.sm {
		padding: var(--spacing-2-m) var(--spacing-3-m);
		font-size: var(--text-sm);
		height: 32px;
	}

	.btn.md {
		padding: var(--spacing-3-m) var(--spacing-4-m);
		font-size: var(--text-base);
		height: 40px;
	}

	.btn.lg {
		padding: var(--spacing-4-m) var(--spacing-6-m);
		font-size: var(--text-lg);
		height: 48px;
	}

	/* variants */
	.btn.primary {
		background: var(--color-button-primary-bg);
		color: var(--color-button-primary-text);
	}

	.btn.primary:hover:not(.disabled) {
		opacity: 0.9;
	}

	.btn.secondary {
		background: var(--color-button-secondary-bg);
		color: var(--color-button-secondary-text);
		border: 1px solid var(--color-border-default);
	}

	.btn.secondary:hover:not(.disabled) {
		background: var(--color-bg-surface-selected);
	}

	/* disabled */
	.btn.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* spinner */
	.spinner-centered {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.spinner {
		display: inline-block;
		width: 16px;
		height: 16px;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
		flex-shrink: 0;
		margin: 0;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.text {
		display: inline-flex;
		align-items: center;
		line-height: 1;
		min-height: 0;
	}

	/* touch improvements */
	@media (hover: none) {
		.btn:active:not(.disabled) {
			transform: scale(0.96);
		}
	}
</style>
