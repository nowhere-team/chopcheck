<script lang="ts">
	import Delimiter from '$components/Delimiter.svelte'
	import EditableText from '$components/EditableText.svelte'
	import Emoji from '$components/Emoji.svelte'
	import EmojiPicker from '$components/EmojiPicker.svelte'
	import SettingItem from '$components/SettingItem.svelte'
	import { m } from '$lib/i18n.js'

	let name = $state('Обед в Ростике')
	let icon = $state('🍔')

	function handleSelectEmoji(emoji: string) {
		icon = emoji
	}
</script>

<div class="page">
	<div class="header">
		<h1 class="title">{m.app_title_create()}</h1>
		<div class="header-name">
			<EditableText
				bind:value={name}
				maxWidthView="32ch"
				maxWidthEdit="64ch"
				placeholder={m.create_split_name_placeholder()}
			/>
		</div>
	</div>

	<div class="settings">
		<!--suppress JSUnusedGlobalSymbols -->
		<SettingItem label={m.create_split_icon_label()} sheetTitle={m.emoji_picker_label()}>
			{#snippet value()}
				<Emoji emoji={icon} size={24} />
			{/snippet}

			{#snippet sheet()}
				<EmojiPicker selected={icon} onselect={handleSelectEmoji} />
			{/snippet}
		</SettingItem>

		<!--suppress JSUnusedGlobalSymbols -->
		<SettingItem
			label={m.create_split_participants_label()}
			sheetTitle={m.split_participants_label()}
		>
			{#snippet sheet()}{/snippet}
		</SettingItem>
	</div>

	<Delimiter />

	<div class="section">
		<h2>{m.create_split_positions_title()}</h2>
		<p class="hint">{m.create_split_positions_hint()}</p>
	</div>
</div>

<style>
	.header {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2-m);
	}

	.header-name {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-3-m);
		color: var(--color-text-primary);
	}

	.settings {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2-m);
	}
</style>
