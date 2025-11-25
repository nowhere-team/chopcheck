<script lang="ts">
	import type { Snippet } from 'svelte'

	import BottomSheet from '$components/BottomSheet.svelte'
	import Box from '$components/Box.svelte'

	interface Props {
		sheetTitle?: string
		sheetHeight?: number
		content: Snippet
		sheet?: Snippet
	}

	const { sheetTitle, sheetHeight = 60, content, sheet }: Props = $props()

	let showSheet = $state(false)
	let disableHover = $state(false)

	function handleOpen() {
		showSheet = true

		setTimeout(() => {
			disableHover = true
		}, 150)
	}

	function handleClose() {
		showSheet = false
		disableHover = false
	}
</script>

<Box interactive onclick={handleOpen} disabled={disableHover}>
	{@render content()}
</Box>

{#if sheet && sheetTitle}
	<BottomSheet
		bind:open={showSheet}
		title={sheetTitle}
		height={sheetHeight}
		onclose={handleClose}
	>
		{@render sheet()}
	</BottomSheet>
{/if}
