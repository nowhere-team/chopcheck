<script lang="ts">
	import { getPlatform } from '$lib/app/context.svelte.js'
	import { Emoji } from '$lib/ui/components'

	import EmojiPickerSheet from './EmojiPickerSheet.svelte'

	interface Props {
		value: string
		centered?: boolean
		size?: number
		class?: string
		onchange?: (value: string) => void
	}

	let {
		value = $bindable(),
		centered = false,
		size = 48,
		class: className = '',
		onchange
	}: Props = $props()

	const platform = getPlatform()

	let isPickerOpen = $state(false)
	let isFocused = $state(false)

	function openPicker() {
		isPickerOpen = true
		isFocused = true
		platform.haptic.selection()
	}

	function handleSelect(emoji: string) {
		value = emoji
		// Важно: вызываем onchange после обновления value
		onchange?.(emoji)
		isPickerOpen = false
		isFocused = false
		platform.haptic.impact('light')
	}

	function handleClose() {
		isPickerOpen = false
		isFocused = false
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			openPicker()
		}
	}
</script>

<div
	class="wrapper {className}"
	class:centered
	role="button"
	tabindex="0"
	onclick={openPicker}
	onkeydown={handleKeyDown}
	oncontextmenu={e => e.preventDefault()}
>
	<button
		type="button"
		class="emoji-button"
		class:focused={isFocused}
		aria-label="Выбрать эмодзи"
	>
		<Emoji emoji={value} {size} />
	</button>
</div>

<EmojiPickerSheet
	bind:open={isPickerOpen}
	selected={value}
	onselect={handleSelect}
	onclose={handleClose}
/>

<style>
	.wrapper {
		width: fit-content;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}

	.wrapper:focus {
		outline: none;
	}

	.wrapper.centered {
		display: flex;
		justify-content: center;
		margin: 0 auto;
	}

	.emoji-button {
		all: unset;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 48px;
		min-width: 48px;
		padding: var(--space-2);
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		outline: none;
		transition:
			border-color 0.15s var(--ease-out),
			box-shadow 0.15s var(--ease-out),
			transform 0.1s var(--ease-out);
		cursor: pointer;
	}

	.emoji-button:hover {
		border-color: color-mix(in srgb, var(--color-primary) 50%, var(--color-border));
	}

	.emoji-button:active {
		transform: scale(0.95);
	}

	.emoji-button.focused {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
	}
</style>
