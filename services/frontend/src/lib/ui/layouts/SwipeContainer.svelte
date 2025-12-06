<script lang="ts">
	import type { Snippet } from 'svelte'

	import { page } from '$app/state'
	import { getPlatform } from '$lib/app/context.svelte'
	import { swipeController } from '$lib/navigation/swipe.svelte'

	interface Props {
		children?: Snippet
	}

	const { children }: Props = $props()
	const platform = getPlatform()

	// sync platform and path
	$effect(() => {
		swipeController.setPlatform(platform)
	})

	$effect(() => {
		swipeController.setCurrentPath(page.url.pathname)
	})

	function handleTouchStart(e: TouchEvent) {
		swipeController.handleTouchStart(e)
	}

	function handleTouchMove(e: TouchEvent) {
		const shouldPrevent = swipeController.handleTouchMove(e)
		if (shouldPrevent) {
			e.preventDefault()
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		swipeController.handleTouchEnd(e)
	}
</script>

<div
	class="swipe-container"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	role="presentation"
>
	{@render children?.()}
</div>

<style>
	.swipe-container {
		min-height: 100%;
		touch-action: pan-y;
	}
</style>
