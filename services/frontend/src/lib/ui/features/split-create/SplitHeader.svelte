<script lang="ts">
	import { m } from '$lib/i18n'
	import { EditableEmoji, EditableText } from '$lib/ui/forms'

	import { getSplitCreateContext } from './context.svelte'

	interface Props {
		onNameChange: (val: string) => void
		onIconChange: (val: string) => void
	}

	const { onNameChange, onIconChange }: Props = $props()
	const ctx = getSplitCreateContext()

	function handleNameChange(val: string) {
		ctx.localName = val
		onNameChange(val)
	}

	function handleIconChange(val: string) {
		ctx.localIcon = val
		onIconChange(val)
	}
</script>

<header class="split-header">
	<EditableEmoji value={ctx.localIcon} centered size={65} onchange={handleIconChange} />
	<EditableText
		value={ctx.localName}
		placeholder={m.create_split_name_label()}
		centered
		adaptive
		animated
		onchange={handleNameChange}
	/>
</header>

<style>
	.split-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
</style>
