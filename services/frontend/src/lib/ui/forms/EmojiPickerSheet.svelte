<script lang="ts">
	import { m } from '$lib/i18n'
	import { Emoji } from '$lib/ui/components'
	import { BottomSheet } from '$lib/ui/overlays'

	interface Props {
		open: boolean
		selected?: string
		onselect?: (emoji: string) => void
		onclose?: () => void
	}

	let { open = $bindable(), selected, onselect, onclose }: Props = $props()

	// prettier-ignore
	const categories = {
		food: ['🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥙', '🥗', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍘'],
		drinks: ['☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉'],
		activities: ['🎉', '🎊', '🎈', '🎁', '🎀', '🎂', '🎄', '🎃', '🏆', '🎯', '🎲', '🎮', '🎸', '🎬', '🎭', '🎪'],
		travel: ['✈️', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲'],
		objects: ['📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🎧', '🎤', '📷', '📹', '🎥', '📺', '📻', '⏰', '⏱️', '⏲️'],
		symbols: ['❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍', '💯', '💢', '💥', '💫', '💦', '💨', '🔥', '✨', '⭐', '🌟']
	}

	const categoryNames: Record<string, string> = {
		food: m.emoji_picker_food_category(),
		drinks: m.emoji_picker_drinks_category(),
		activities: m.emoji_picker_activities_category(),
		travel: m.emoji_picker_travel_category(),
		objects: m.emoji_picker_objects_category(),
		symbols: m.emoji_picker_symbols_category()
	}

	function handleSelect(emoji: string) {
		onselect?.(emoji)
	}
</script>

<BottomSheet bind:open {onclose} title={m.emoji_picker_label()}>
	<div class="picker">
		{#each Object.entries(categories) as [key, emojis] (key)}
			<div class="category">
				<h3 class="category-title">{categoryNames[key]}</h3>
				<div class="emoji-grid">
					{#each emojis as emoji (emoji)}
						<button
							type="button"
							class="emoji-button"
							class:selected={emoji === selected}
							onclick={() => handleSelect(emoji)}
						>
							<Emoji {emoji} size={32} lazy={true} />
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</BottomSheet>

<style>
	.picker {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		padding-bottom: var(--space-4);
		max-height: 60vh;
	}

	.category {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.category-title {
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
		color: var(--color-text-secondary);
		margin: 0;
		position: sticky;
		top: 0;
		background: var(--color-bg);
		padding: var(--space-2) 0;
		z-index: 1;
	}

	.emoji-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
		gap: var(--space-2);
	}

	.emoji-button {
		all: unset;
		display: flex;
		align-items: center;
		justify-content: center;
		aspect-ratio: 1;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.15s var(--ease-out);
		-webkit-tap-highlight-color: transparent;
	}

	.emoji-button:hover {
		background: var(--color-bg-secondary);
	}

	.emoji-button:active {
		transform: scale(0.9);
	}

	.emoji-button.selected {
		background: color-mix(in srgb, var(--color-primary) 15%, transparent);
		box-shadow: 0 0 0 2px var(--color-primary);
	}
</style>
