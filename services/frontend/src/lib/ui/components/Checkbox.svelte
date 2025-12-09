<script lang="ts">
	import { Check } from 'phosphor-svelte'

	import { getPlatform } from '$lib/app/context.svelte'

	interface Props {
		checked: boolean
		label?: string
		disabled?: boolean
		onchange?: (val: boolean) => void
	}

	let { checked = $bindable(), label, disabled = false, onchange }: Props = $props()
	const platform = getPlatform()

	function toggle() {
		if (disabled) return
		checked = !checked
		if (onchange) onchange(checked)
		platform.haptic.selection()
	}
</script>

<button
	class="checkbox-wrapper"
	onclick={toggle}
	class:disabled
	role="checkbox"
	aria-checked={checked}
>
	<span class="box" class:checked>
		{#if checked}
			<Check size={14} weight="bold" color="#fff" />
		{/if}
	</span>
	{#if label}
		<span class="label">{label}</span>
	{/if}
</button>

<style>
	.checkbox-wrapper {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		cursor: pointer;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
		transition: opacity 0.2s;
	}

	.checkbox-wrapper:active {
		opacity: 0.7;
	}

	.checkbox-wrapper.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.box {
		width: 22px;
		height: 22px;
		border-radius: 6px;
		border: 2px solid var(--color-border);
		background: var(--color-bg-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s var(--ease-out);
	}

	.box.checked {
		background: var(--color-primary);
		border-color: var(--color-primary);
		transform: scale(1.05);
	}

	.label {
		font-size: var(--text-base);
		color: var(--color-text);
		line-height: normal;
	}
</style>
