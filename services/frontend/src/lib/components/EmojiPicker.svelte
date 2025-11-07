<script lang="ts">
	import Emoji from '$components/Emoji.svelte'
	import { m } from '$lib/i18n'

	interface Props {
		selected?: string
		onselect: (emoji: string) => void
	}

	const { selected, onselect }: Props = $props()

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
		onselect(emoji)
	}
</script>

<div class="emoji-picker">
	{#each Object.entries(categories) as [category, emojis] (category)}
		<div class="category">
			<h3>{categoryNames[category]}</h3>
			<div class="emojis">
				{#each emojis as emoji (emoji)}
					<button
						class="emoji-btn"
						class:selected={selected === emoji}
						onclick={() => handleSelect(emoji)}
						type="button"
					>
						<Emoji {emoji} size={32} />
					</button>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.emoji-picker {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4-m);
	}

	.category h3 {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-2-m);
	}

	.emojis {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
		gap: var(--spacing-2-m);
	}

	.emoji-btn {
		all: unset;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: var(--radius-default);
		cursor: pointer;
		transition: all 150ms;
		box-sizing: border-box;
		-webkit-tap-highlight-color: transparent;
	}

	.emoji-btn:hover {
		background: var(--color-bg-surface-secondary);
	}

	.emoji-btn:active {
		transform: scale(0.95);
	}

	.emoji-btn.selected {
		background: var(--color-bg-surface-selected);
		border: 2px solid var(--color-button-primary-bg);
	}
</style>
