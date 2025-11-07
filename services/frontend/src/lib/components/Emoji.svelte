<script lang="ts">
	import twemoji from '@twemoji/api'

	interface Props {
		emoji: string
		size?: number
	}

	const { emoji, size = 32 }: Props = $props()

	let container: HTMLSpanElement

	$effect(() => {
		if (container && emoji) {
			// eslint-disable-next-line svelte/no-dom-manipulating
			container.textContent = emoji

			twemoji.parse(container, {
				folder: 'svg',
				ext: '.svg'
			})

			const img = container.querySelector('img')
			if (img) {
				img.style.width = `${size}px`
			}
		}
	})
</script>

<span class="emoji-container" bind:this={container}>
	{emoji}
</span>

<style>
	.emoji-container {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	/*noinspection CssUnusedSymbol*/
	.emoji-container :global(img.emoji) {
		display: inline-block;
		margin: 0;
		vertical-align: middle;
	}
</style>
