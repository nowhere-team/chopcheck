<!--suppress CssNonIntegerLengthInPixels -->
<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLButtonAttributes } from 'svelte/elements'

	import { haptic } from '$telegram/haptic'

	interface Props {
		variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'card' | 'danger'
		size?: 'sm' | 'md' | 'lg'
		disabled?: boolean
		loading?: boolean
		hideTextOnLoading?: boolean
		iconOnly?: boolean
		type?: 'button' | 'submit' | 'reset'
		iconLeft?: Snippet
		iconRight?: Snippet
		content?: Snippet
		onclick?: (e: MouseEvent) => unknown
	}

	const {
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		hideTextOnLoading = false,
		iconOnly = false,
		type = 'button',
		iconLeft,
		iconRight,
		content,
		onclick,
		children,
		...rest
	}: HTMLButtonAttributes & Props = $props()

	const isDisabled = $derived(disabled || loading)
	const showText = $derived(!loading || !hideTextOnLoading)
	const hasText = $derived(children !== undefined)
	const isCard = $derived(variant === 'card')
</script>

<button
	class="btn"
	class:primary={variant === 'primary'}
	class:secondary={variant === 'secondary'}
	class:outline={variant === 'outline'}
	class:ghost={variant === 'ghost'}
	class:card={variant === 'card'}
	class:danger={variant === 'danger'}
	class:sm={size === 'sm'}
	class:md={size === 'md'}
	class:lg={size === 'lg'}
	class:icon-only={iconOnly || (!hasText && !content && (iconLeft || iconRight))}
	class:disabled={isDisabled}
	disabled={isDisabled}
	onclick={() => {
		haptic.medium()
		onclick?.()
	}}
	{type}
	{...rest}
>
	{#if loading && hideTextOnLoading}
		<span class="spinner-centered">
			<span class="spinner"></span>
		</span>
	{:else if isCard && content}
		<div class="card-content">
			{#if iconLeft}
				<span class="card-icon">
					{@render iconLeft()}
				</span>
			{/if}
			<div class="card-text">
				{@render content()}
			</div>
		</div>
	{:else}
		<div class="btn-content">
			{#if loading && !hideTextOnLoading}
				<span class="icon">
					<span class="spinner"></span>
				</span>
			{:else if iconLeft}
				<span class="icon">
					{@render iconLeft()}
				</span>
			{/if}

			{#if showText && hasText}
				<span class="text">
					{@render children?.()}
				</span>
			{/if}

			{#if iconRight && !loading}
				<span class="icon">
					{@render iconRight()}
				</span>
			{/if}
		</div>
	{/if}
</button>

<style>
	.btn {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-weight: var(--font-medium);
		border-radius: 12px;
		transition:
			transform 120ms cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 120ms cubic-bezier(0.4, 0, 0.2, 1),
			background 120ms cubic-bezier(0.4, 0, 0.2, 1),
			border-color 120ms cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
		border: none;
		isolation: isolate;
		overflow: hidden;
	}

	/* sizes */
	.btn.sm {
		padding: var(--spacing-2-m) var(--spacing-4-m);
		font-size: var(--text-sm);
		min-height: 36px;
		height: 36px;
		min-width: 64px;
	}

	.btn.md {
		padding: var(--spacing-3-m) var(--spacing-5-m);
		font-size: var(--text-base);
		min-height: 44px;
		height: 44px;
		min-width: 80px;
	}

	.btn.lg {
		padding: var(--spacing-4-m) var(--spacing-6-m);
		font-size: var(--text-base);
		min-height: 52px;
		height: 52px;
		min-width: 96px;
	}

	/* card variant has custom sizing */
	.btn.card {
		min-height: unset;
		height: auto;
		width: 100%;
		padding: var(--spacing-4-m);
		justify-content: flex-start;
	}

	/* icon-only mode */
	.btn.icon-only {
		min-width: unset;
		aspect-ratio: 1;
		padding: 0;
	}

	.btn.icon-only.sm {
		width: 36px;
		height: 36px;
	}

	.btn.icon-only.md {
		width: 44px;
		height: 44px;
	}

	.btn.icon-only.lg {
		width: 52px;
		height: 52px;
	}

	/* compensate for border */
	.btn.secondary,
	.btn.outline,
	.btn.danger {
		padding: calc(var(--spacing-3-m) - 1.5px) calc(var(--spacing-5-m) - 1.5px);
	}

	.btn.secondary.sm,
	.btn.outline.sm,
	.btn.danger.sm {
		padding: calc(var(--spacing-2-m) - 1.5px) calc(var(--spacing-4-m) - 1.5px);
	}

	.btn.secondary.lg,
	.btn.outline.lg,
	.btn.danger.lg {
		padding: calc(var(--spacing-4-m) - 1.5px) calc(var(--spacing-6-m) - 1.5px);
	}

	/* card with border */
	.btn.card.secondary {
		padding: calc(var(--spacing-4-m) - 1.5px);
	}

	/* icon-only with border */
	.btn.icon-only.secondary,
	.btn.icon-only.outline,
	.btn.icon-only.danger {
		padding: 0;
	}

	/* primary */
	.btn.primary {
		background: var(--color-button-primary-bg);
		color: var(--color-button-primary-text);
		box-shadow:
			0 1px 2px rgba(15, 23, 42, 0.15),
			0 2px 6px rgba(15, 23, 42, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	.btn.primary::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%);
		opacity: 1;
		transition: opacity 120ms;
		pointer-events: none;
	}

	.btn.primary:hover:not(.disabled) {
		background: color-mix(in srgb, var(--color-button-primary-bg) 92%, white);
		box-shadow:
			0 2px 4px rgba(15, 23, 42, 0.18),
			0 4px 12px rgba(15, 23, 42, 0.12),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	.btn.primary:hover:not(.disabled)::before {
		opacity: 0.7;
	}

	.btn.primary:active:not(.disabled) {
		transform: scale(0.97);
		background: color-mix(in srgb, var(--color-button-primary-bg) 95%, black);
		box-shadow:
			0 1px 2px rgba(15, 23, 42, 0.2),
			inset 0 2px 4px rgba(0, 0, 0, 0.15);
	}

	.btn.primary:active:not(.disabled)::before {
		opacity: 0;
	}

	/* secondary */
	.btn.secondary {
		background: var(--color-bg-surface);
		color: var(--color-text-primary);
		border: 1.5px solid var(--color-border-default);
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.04),
			inset 0 1px 0 rgba(255, 255, 255, 0.03);
	}

	.btn.secondary:hover:not(.disabled) {
		background: var(--color-bg-surface-selected);
		border-color: color-mix(in srgb, var(--color-text-primary) 30%, transparent);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}

	.btn.secondary:active:not(.disabled) {
		transform: scale(0.98);
		background: var(--color-bg-surface-secondary);
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	/* outline */
	.btn.outline {
		background: color-mix(in srgb, var(--color-button-primary-bg) 6%, transparent);
		color: var(--color-button-primary-bg);
		border: 1.5px solid color-mix(in srgb, var(--color-button-primary-bg) 30%, transparent);
		box-shadow: none;
	}

	.btn.outline:hover:not(.disabled) {
		background: color-mix(in srgb, var(--color-button-primary-bg) 12%, transparent);
		border-color: color-mix(in srgb, var(--color-button-primary-bg) 50%, transparent);
	}

	.btn.outline:active:not(.disabled) {
		transform: scale(0.98);
		background: color-mix(in srgb, var(--color-button-primary-bg) 16%, transparent);
		border-color: color-mix(in srgb, var(--color-button-primary-bg) 70%, transparent);
	}

	/* ghost */
	.btn.ghost {
		background: transparent;
		color: var(--color-text-primary);
		border: none;
		box-shadow: none;
		min-width: auto;
	}

	.btn.ghost:hover:not(.disabled) {
		background: color-mix(in srgb, var(--color-text-primary) 8%, transparent);
	}

	.btn.ghost:active:not(.disabled) {
		transform: scale(0.98);
		background: color-mix(in srgb, var(--color-text-primary) 12%, transparent);
	}

	/* card */
	.btn.card {
		background: var(--color-bg-surface-secondary);
		color: var(--color-text-primary);
		border: 1.5px solid var(--color-border-default);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
	}

	.btn.card:hover:not(.disabled) {
		background: var(--color-bg-surface);
		border-color: color-mix(in srgb, var(--color-text-primary) 20%, transparent);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
	}

	.btn.card:active:not(.disabled) {
		transform: scale(0.99);
		background: var(--color-bg-surface-selected);
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.08);
	}

	/* danger */
	.btn.danger {
		background: rgba(239, 68, 68, 0.08);
		color: var(--color-text-error, #ef4444);
		border: 1.5px solid color-mix(in srgb, #ef4444 40%, transparent);
		box-shadow: 0 1px 2px rgba(239, 68, 68, 0.08);
	}

	.btn.danger:hover:not(.disabled) {
		background: rgba(239, 68, 68, 0.12);
		border-color: color-mix(in srgb, #ef4444 60%, transparent);
		box-shadow: 0 1px 3px rgba(239, 68, 68, 0.15);
	}

	.btn.danger:active:not(.disabled) {
		transform: scale(0.98);
		background: rgba(239, 68, 68, 0.16);
		border-color: #ef4444;
		box-shadow: inset 0 1px 2px rgba(239, 68, 68, 0.2);
	}

	/* disabled */
	.btn.disabled {
		opacity: 0.4;
		cursor: not-allowed;
		box-shadow: none;
	}

	.btn.disabled::before {
		display: none;
	}

	/* button content wrapper */
	.btn-content {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-2-m);
		width: 100%;
		min-width: 0;
		position: relative;
		z-index: 1;
	}

	/* icon wrapper */
	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		line-height: 1;
	}

	/* text wrapper with proper ellipsis */
	.text {
		display: block;
		line-height: 1.2;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* card layout */
	.card-content {
		display: flex;
		align-items: center;
		gap: var(--spacing-4-m);
		width: 100%;
		min-width: 0;
		position: relative;
		z-index: 1;
	}

	.card-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		background: color-mix(in srgb, var(--color-button-primary-bg) 10%, transparent);
		border-radius: 10px;
		flex-shrink: 0;
		color: var(--color-button-primary-bg);
	}

	.card-text {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-m);
		flex: 1;
		min-width: 0;
		text-align: left;
	}

	/* icon-only doesn't need gap */
	.btn.icon-only .btn-content {
		gap: 0;
	}

	/* spinner */
	.spinner-centered {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2;
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

	/* touch improvements */
	@media (hover: none) {
		.btn:active:not(.disabled) {
			transform: scale(0.96);
		}

		.btn.card:active:not(.disabled) {
			transform: scale(0.98);
		}
	}
</style>
