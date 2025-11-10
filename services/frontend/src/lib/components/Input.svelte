<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements'

	interface Props {
		label?: string
		value?: string | number
		suffix?: string
		error?: string
	}

	let {
		label,
		value = $bindable(''),
		suffix,
		error,
		...rest
	}: Props & HTMLInputAttributes = $props()

	const id = `input-${Math.random().toString(36).slice(2, 11)}`
</script>

<div class="input-group" class:has-error={error}>
	{#if label}
		<label class="label" for={id}>{label}</label>
	{/if}
	<div class="input-wrapper">
		<input class="input" bind:value {id} {...rest} />
		{#if suffix}
			<span class="suffix">{suffix}</span>
		{/if}
	</div>
	{#if error}
		<span class="error">{error}</span>
	{/if}
</div>

<style>
	.input-group {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2-m);
	}

	.label {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-text-secondary);
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input {
		width: 100%;
		padding: var(--spacing-3-m) var(--spacing-4-m);
		font-size: var(--text-md);
		color: var(--color-text-primary);
		background: var(--color-bg-surface-secondary);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-default);
		transition: all 150ms;
	}

	.input:focus {
		outline: none;
		border-color: var(--color-button-primary-bg);
		background: var(--color-bg-surface);
	}

	.input-group.has-error .input {
		border-color: var(--color-text-error, #ef4444);
	}

	.suffix {
		position: absolute;
		right: var(--spacing-4-m);
		font-size: var(--text-md);
		color: var(--color-text-secondary);
		pointer-events: none;
	}

	.input:focus + .suffix {
		color: var(--color-text-primary);
	}

	.error {
		font-size: var(--text-sm);
		color: var(--color-text-error, #ef4444);
	}

	.input::placeholder {
		color: var(--color-text-tertiary);
	}
</style>
