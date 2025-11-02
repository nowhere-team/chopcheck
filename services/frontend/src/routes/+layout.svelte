<script lang="ts">
	import '$lib/assets/styles/reset.css'
	import '$lib/assets/styles/fonts.css'
	import '$lib/assets/styles/typography.css'
	import '$lib/assets/styles/theme.css'
	import '$lib/assets/styles/animations.css'
	import '$lib/assets/styles/global.css'

	import { onNavigate } from '$app/navigation'
	import Navbar from '$components/Navbar.svelte'
	import SwipeContainer from '$components/SwipeContainer.svelte'
	import TelegramContext from '$components/TelegramContext.svelte'
	import { setActiveSplitsContext } from '$lib/contexts/active-splits.svelte'
	import { setSplitsHistoryContext } from '$lib/contexts/splits-history.svelte'
	import { setStatsContext } from '$lib/contexts/stats.svelte'
	import { getNavigationDirection } from '$lib/navigation/carousel'

	const { children } = $props()

	setStatsContext()
	setActiveSplitsContext()
	setSplitsHistoryContext()

	// add transition between pages
	onNavigate(navigation => {
		if (!document.startViewTransition) return

		document.documentElement.dataset.direction = getNavigationDirection(
			navigation.from?.url.pathname || '/',
			navigation.to?.url.pathname || '/'
		)

		return new Promise(resolve => {
			document.startViewTransition(async () => {
				resolve()
				await navigation.complete
			})
		})
	})
</script>

<div class="app">
	<TelegramContext>
		<SwipeContainer>
			<div class="app-container" style="view-transition-name: page-content">
				{@render children?.()}
			</div>
		</SwipeContainer>
		<Navbar />
	</TelegramContext>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
	}

	.app-container {
		min-height: calc(100dvh - 64px - max(var(--tg-inset-bottom), 8px));
		padding-bottom: calc(64px + max(var(--tg-inset-bottom), 8px));
	}
</style>
