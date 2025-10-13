<script lang="ts">
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import { setSwipeContext } from '$lib/contexts/swipe.svelte'
	import { CAROUSEL_ROUTES, type CarouselRoute } from '$lib/navigation/carousel'
	import { haptic } from '$telegram/haptic'

	const { children } = $props()

	const swipeContext = setSwipeContext(true)

	let startX = 0
	let startY = 0

	const SWIPE_THRESHOLD = 80
	const VERTICAL_TOLERANCE = 50

	function handleTouchStart(e: TouchEvent) {
		if (!swipeContext?.enabled) return

		startX = e.touches[0].clientX
		startY = e.touches[0].clientY
	}

	function handleTouchMove(e: TouchEvent) {
		if (!swipeContext?.enabled) return

		const deltaX = e.touches[0].clientX - startX
		const deltaY = e.touches[0].clientY - startY

		if (Math.abs(deltaY) > VERTICAL_TOLERANCE && Math.abs(deltaY) > Math.abs(deltaX)) {
			return
		}

		if (Math.abs(deltaX) > 15) {
			e.preventDefault()
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		if (!swipeContext?.enabled) return

		const deltaX = e.changedTouches[0].clientX - startX
		const currentIndex = CAROUSEL_ROUTES.indexOf(page.url.pathname as CarouselRoute)

		if (currentIndex === -1) return

		if (deltaX > SWIPE_THRESHOLD && currentIndex > 0) {
			haptic.medium()
			goto(resolve(CAROUSEL_ROUTES[currentIndex - 1]))
		} else if (deltaX < -SWIPE_THRESHOLD && currentIndex < CAROUSEL_ROUTES.length - 1) {
			haptic.medium()
			goto(resolve(CAROUSEL_ROUTES[currentIndex + 1]))
		}
	}
</script>

<!--suppress HtmlUnknownAttribute -->
<div
	class="swipe-container"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
>
	{@render children?.()}
</div>

<style>
	.swipe-container {
		height: max-content;
		touch-action: pan-y;
		position: relative;
	}
</style>
