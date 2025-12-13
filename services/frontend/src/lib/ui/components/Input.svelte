<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements'

	import Label from '$lib/ui/components/Label.svelte'

	interface Props extends HTMLInputAttributes {
		label?: string
		suffix?: string
		error?: string
		value: string | number
	}

	let {
		label,
		suffix,
		error,
		value = $bindable(),
		class: className,
		id: providedId,
		...rest
	}: Props = $props()

	/* generate id only if needed for accessibility link */
	const id = providedId || `input-${Math.random().toString(36).slice(2)}`
</script>

<div class="input-group {className || ''}" class:has-error={!!error}>
	{#if label}
		<Label for={id}>{label}</Label>
	{/if}

	<div class="input-wrapper">
		<input class="input" {id} bind:value aria-invalid={!!error} {...rest} />
		{#if suffix}
			<span class="suffix" aria-hidden="true">{suffix}</span>
		{/if}
	</div>

	{#if error}
		<span class="error-msg" role="alert">{error}</span>
	{/if}
</div>

<style>
	.input-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		width: 100%;
	}

	.label {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-text-secondary);
		margin-left: var(--space-1);
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input {
		width: 100%;
		padding: 12px var(--space-4);
		padding-right: 40px; /* space for suffix */
		font-size: var(--text-base);
		color: var(--color-text);
		background: var(--color-bg-secondary);
		border: 1px solid transparent;
		border-radius: var(--radius-lg);
		transition: all var(--duration-fast) var(--ease-out);
		-webkit-appearance: none;
		appearance: none;
	}

	.input:focus {
		outline: none;
		background: var(--color-bg);
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 20%, transparent);
	}

	.has-error .input {
		border-color: var(--color-error);
		background: color-mix(in srgb, var(--color-error) 5%, var(--color-bg-secondary));
	}

	.has-error .input:focus {
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-error) 20%, transparent);
	}

	.suffix {
		position: absolute;
		right: var(--space-4);
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
		pointer-events: none;
	}

	.error-msg {
		font-size: var(--text-xs);
		color: var(--color-error);
		margin-left: var(--space-1);
		animation: slide-down 0.2s ease-out;
	}

	@keyframes slide-down {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
