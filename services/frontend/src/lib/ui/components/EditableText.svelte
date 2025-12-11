<script lang="ts">
	interface Props {
		value: string
		placeholder?: string
		centered?: boolean
		adaptive?: boolean
		fontSize?: string
		fontWeight?: string
		animated?: boolean
		class?: string
	}

	let {
		value = $bindable(),
		placeholder = 'Введите название...',
		centered = false,
		adaptive = false,
		fontSize = 'var(--text-xl)',
		fontWeight = 'var(--font-bold)',
		animated = false,
		class: className = ''
	}: Props = $props()

	let isEditing = $state(false)
	let editableRef: HTMLDivElement | undefined = $state()
	let measureRef: HTMLSpanElement | undefined = $state()
	let currentWidth = $state<number | null>(null)

	const displayValue = $derived(value || placeholder)

	$effect(() => {
		if (editableRef && !isEditing) {
			// eslint-disable-next-line svelte/no-dom-manipulating
			editableRef.textContent = value
		}
	})

	$effect(() => {
		if (!adaptive || !animated || !measureRef) return

		const observer = new ResizeObserver(entries => {
			for (const entry of entries) {
				currentWidth = entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width
			}
		})

		observer.observe(measureRef)

		return () => observer.disconnect()
	})

	function startEditing() {
		if (!isEditing) {
			editableRef?.focus()
			setTimeout(() => {
				const range = document.createRange()
				const sel = window.getSelection()
				if (editableRef && sel) {
					range.selectNodeContents(editableRef)
					range.collapse(false)
					sel.removeAllRanges()
					sel.addRange(range)
				}
			}, 0)
		}
	}

	function handleFocus() {
		isEditing = true
	}

	function handleBlur() {
		isEditing = false
		if (!value.trim()) value = ''
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLDivElement
		value = target.textContent || ''
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault()
			editableRef?.blur()
		}
	}

	function handleWrapperClick() {
		startEditing()
	}

	function handleWrapperKeyDown(e: KeyboardEvent) {
		if (isEditing) return

		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			startEditing()
		}
	}
</script>

<div
	class="editable-wrapper {className}"
	class:centered
	class:adaptive
	role="button"
	tabindex="0"
	onclick={handleWrapperClick}
	onkeydown={handleWrapperKeyDown}
>
	<div class="editable-container">
		{#if adaptive}
			<span
				bind:this={measureRef}
				class="measure"
				aria-hidden="true"
				style:font-size={fontSize}
				style:font-weight={fontWeight}
			>
				{displayValue}
			</span>
		{/if}

		<div
			bind:this={editableRef}
			class="editable"
			class:focused={isEditing}
			class:animated
			contenteditable="true"
			role="textbox"
			tabindex="-1"
			aria-label={placeholder}
			data-placeholder={placeholder}
			onfocus={handleFocus}
			onblur={handleBlur}
			oninput={handleInput}
			onkeydown={handleKeyDown}
			spellcheck="false"
			style:font-size={fontSize}
			style:font-weight={fontWeight}
			style:width={animated && currentWidth ? `${currentWidth}px` : null}
		></div>
	</div>
</div>

<style>
	.editable-wrapper {
		width: 100%;
		cursor: text;
	}

	.editable-wrapper:focus {
		outline: none;
	}

	.editable-wrapper.centered {
		display: flex;
		justify-content: center;
	}

	.editable-container {
		display: contents;
	}

	.adaptive .editable-container {
		display: grid;
		grid-template-columns: 1fr;
		align-items: center;
		justify-items: start;
		position: relative;
	}

	.adaptive.centered .editable-container {
		justify-items: center;
	}

	.measure {
		grid-area: 1 / 1 / 2 / 2;
		visibility: hidden;
		white-space: pre;
		padding: var(--space-1) var(--space-2);
		line-height: 1.4;
		min-height: 32px;
		border: 1px solid transparent;
		pointer-events: none;
	}

	.editable {
		width: 100%;
		min-height: 32px;
		padding: var(--space-1) var(--space-2);
		line-height: 1.4;
		color: var(--color-text);
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		outline: none;
		white-space: pre-wrap;
		word-break: break-word;
		transition:
			border-color 0.15s var(--ease-out),
			box-shadow 0.15s var(--ease-out);
		-webkit-tap-highlight-color: transparent;
	}

	.adaptive .editable {
		grid-area: 1 / 1 / 2 / 2;
		white-space: nowrap;
	}

	.adaptive .editable:not(.focused) {
		overflow: hidden;
	}

	.editable.animated {
		transition:
			width 0.2s var(--ease-out),
			border-color 0.15s var(--ease-out),
			box-shadow 0.15s var(--ease-out);
	}

	.editable.animated.focused {
		transition:
			width 0.08s var(--ease-out),
			border-color 0.15s var(--ease-out),
			box-shadow 0.15s var(--ease-out);
	}

	.editable.focused {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
	}

	.editable:empty::before {
		content: attr(data-placeholder);
		color: var(--color-text-secondary);
		font-weight: var(--font-medium);
	}
</style>
