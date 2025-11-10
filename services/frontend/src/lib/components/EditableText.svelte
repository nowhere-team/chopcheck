<script lang="ts">
	import { NotePencil } from 'phosphor-svelte'
	import { onMount } from 'svelte'

	import { haptic } from '$telegram/haptic'

	let {
		value = $bindable(''),
		placeholder = '',
		maxlength = 32,
		maxWidthView = '24ch',
		maxWidthEdit = '32ch',
		showIcon = true,
		onchange = () => {},
		onLimitReached = () => {}
	} = $props()

	let isEditing = $state(false)
	let measureElement = $state<HTMLSpanElement | null>(null)
	let textWidth = $state(0)
	let isShaking = $state(false)
	let fontsReady = $state(false)

	onMount(async () => {
		// ждем загрузки всех шрифтов
		await document.fonts.ready
		fontsReady = true
	})

	$effect(() => {
		if (measureElement && value && fontsReady) {
			// eslint-disable-next-line svelte/no-dom-manipulating
			measureElement.textContent = value
			textWidth = measureElement.scrollWidth
		}
	})

	function getWrapperWidth() {
		if (!value && !isEditing) {
			return '150px'
		}
		if (!fontsReady || textWidth === 0) {
			return isEditing ? 'min(64ch, calc(100vw - 80px))' : maxWidthView
		}

		const calculatedWidth = `${textWidth + 4}px`
		const maxWidth = isEditing ? 'min(64ch, calc(100vw - 80px))' : maxWidthView

		return `min(${calculatedWidth}, ${maxWidth})`
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement
		const newValue = target.value

		if (newValue.length > maxlength) {
			value = newValue.slice(0, maxlength)
			target.value = value

			shake()
			onLimitReached()
		} else {
			value = newValue
			onchange(value)
		}
	}
	function shake() {
		if (isShaking) return
		isShaking = true
		haptic.soft()
		setTimeout(() => {
			isShaking = false
		}, 500)
	}
</script>

<div class="editable-container" class:editing={isEditing} class:shake={isShaking}>
	<div class="input-wrapper" style="width: {getWrapperWidth()};">
		<input
			type="text"
			{value}
			oninput={handleInput}
			class="editable-input"
			class:editing={isEditing}
			{placeholder}
			onfocus={() => (isEditing = true)}
			onblur={() => (isEditing = false)}
		/>
	</div>
	<span bind:this={measureElement} class="measure-text" aria-hidden="true"></span>
	{#if showIcon}
		<button class="icon-btn" type="button" tabindex="-1">
			<NotePencil color="var(--color-text-secondary)" size={25} />
		</button>
	{/if}
</div>

<style>
	.editable-container {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2-m);
	}

	.editable-container.shake {
		animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
	}

	.input-wrapper {
		position: relative;
		display: flex;
		overflow: visible;
		min-width: 0;
	}

	.editable-input {
		width: 100%;
		min-width: 0;
		border: none;
		background: transparent;
		font-size: var(--text-lg);
		font-weight: var(--font-medium);
		color: var(--color-text-primary);
		padding: 0 0 2px 0;
		border-bottom: 2px solid transparent;
		transition: border-color 0.2s ease;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.editable-input:not(.editing) {
		overflow: hidden;
	}

	.editable-input.editing {
		border-bottom-color: var(--color-text-primary);
		overflow: visible;
		text-overflow: clip;
	}

	.editable-input:focus {
		outline: none;
	}

	.editable-input:focus::placeholder {
		opacity: 0;
	}

	.measure-text {
		position: absolute;
		visibility: hidden;
		white-space: pre;
		font-size: var(--text-lg);
		font-weight: var(--font-medium);
		pointer-events: none;
		left: 0;
	}

	.icon-btn {
		background: transparent;
		border: none;
		padding: 0;
		display: flex;
		align-items: center;
		flex-shrink: 0;
		color: var(--color-text-primary);
		cursor: pointer;
		pointer-events: none;
	}
</style>
