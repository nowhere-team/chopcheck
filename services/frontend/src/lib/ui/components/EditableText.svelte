<script lang="ts">
	import { PencilSimple } from 'phosphor-svelte'

	interface Props {
		value: string
		placeholder?: string
		centered?: boolean
	}

	let {
		value = $bindable(),
		placeholder = 'Введите название...',
		centered = false
	}: Props = $props()

	let isEditing = $state(false)
	let inputRef: HTMLInputElement | undefined = $state()

	function handleFocus() {
		isEditing = true
	}

	function handleBlur() {
		isEditing = false
		if (!value.trim()) value = '' // cleanup
	}
</script>

<div class="editable-wrapper" class:centered onclick={() => inputRef?.focus()}>
	<span class="measure" aria-hidden="true">
		{value || placeholder}
	</span>

	<input
		bind:this={inputRef}
		bind:value
		class="input"
		{placeholder}
		onfocus={handleFocus}
		onblur={handleBlur}
		spellcheck="false"
	/>

	{#if !isEditing && !value}
		<div class="icon">
			<PencilSimple size={16} />
		</div>
	{/if}
</div>

<style>
	.editable-wrapper {
		display: grid;
		grid-template-columns: 1fr;
		align-items: center;
		justify-items: start;
		position: relative;
		min-width: 60px;
		max-width: 100%;
		cursor: text;
		padding: 4px 0;
		border-bottom: 2px solid transparent;
		transition: border-color 0.2s;
	}

	.editable-wrapper.centered {
		justify-items: center;
		text-align: center;
		margin: 0 auto;
	}

	.editable-wrapper:focus-within {
		border-bottom-color: var(--color-primary);
	}

	.measure,
	.input {
		grid-area: 1 / 1 / 2 / 2;
		font-size: var(--text-xl);
		font-weight: var(--font-bold);
		line-height: 1.2;
		width: 100%;
		padding-right: 2px;
	}

	.measure {
		visibility: hidden;
		white-space: pre;
	}

	.input {
		background: transparent;
		border: none;
		color: var(--color-text);
		padding: 0;
		white-space: pre;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.input:focus {
		outline: none;
	}

	.input::placeholder {
		color: var(--color-text-tertiary);
		font-weight: var(--font-medium);
	}

	.icon {
		position: absolute;
		right: -24px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--color-text-tertiary);
		opacity: 0.5;
	}
</style>
