<script lang="ts">
	import twemoji from '@twemoji/api'
	import { onMount } from 'svelte'

	interface Props {
		emoji: string
		size?: number
	}

	const { emoji, size = 32 }: Props = $props()

	let container: HTMLSpanElement

	onMount(() => {
		if (container) {
			twemoji.parse(container, {
				folder: 'svg',
				ext: '.svg'
			})

			const img = container.querySelector('img')
			if (img) {
				img.style.width = `${size}px`
				// img.style.height = `${size}px`
			}
		}
	})
</script>

<span class="emoji-container" bind:this={container}>
	{emoji}
</span>

<!--suppress CssUnusedSymbol -->
<style>
	.emoji-container {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.emoji-container :global(img.emoji) {
		display: inline-block;
		margin: 0;
		vertical-align: middle;
	}
</style>
