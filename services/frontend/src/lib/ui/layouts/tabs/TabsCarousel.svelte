<!--suppress ES6UnusedImports -->
<script lang="ts">
	import type { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel'
	import emblaCarouselSvelte from 'embla-carousel-svelte'
	import { onMount, type Snippet } from 'svelte'

	import { getPlatform } from '$lib/app/context.svelte'

	import { tabsStore } from './store.svelte'

	interface Props {
		children: Snippet
	}

	const { children }: Props = $props()
	const platform = getPlatform()

	let emblaApi = $state<EmblaCarouselType | undefined>()

	const options: EmblaOptionsType = {
		loop: false,
		skipSnaps: false,
		align: 'start',
		containScroll: 'trimSnaps',
		duration: 12,
		dragFree: false,
		startIndex: tabsStore.index
	}

	function onScroll() {
		if (!emblaApi) return
		const progress = emblaApi.scrollProgress()
		const maxIndex = emblaApi.scrollSnapList().length - 1
		tabsStore.updateScrollProgress(progress * maxIndex)
	}

	function onInit(event: CustomEvent<EmblaCarouselType>) {
		emblaApi = event.detail
		tabsStore.setEmblaApi(emblaApi)

		emblaApi.on('scroll', onScroll)
		emblaApi.on('select', () => {
			const idx = emblaApi!.selectedScrollSnap()
			if (idx !== tabsStore.index) {
				tabsStore.updateIndex(idx)
				tabsStore.syncUrl(idx)
				platform.haptic.selection()
			}
		})

		// initial
		onScroll()
	}

	onMount(() => {
		const handlePopState = () => tabsStore.handlePopState()
		window.addEventListener('popstate', handlePopState)
		return () => window.removeEventListener('popstate', handlePopState)
	})
</script>

<!--suppress HtmlUnknownAttribute -->
<div class="tabs-viewport" use:emblaCarouselSvelte={{ options, plugins: [] }} onemblaInit={onInit}>
	<div class="tabs-container">
		{@render children()}
	</div>
</div>

<style>
	.tabs-viewport {
		overflow: hidden;
		width: 100%;
		height: 100%;
		transform: translateZ(0);
	}

	.tabs-container {
		display: flex;
		height: 100%;
		width: 100%;
		touch-action: pan-y pinch-zoom;
	}
</style>
