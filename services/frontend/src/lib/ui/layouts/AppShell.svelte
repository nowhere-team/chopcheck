<script lang="ts">
	import type { Snippet } from 'svelte'

	import { page } from '$app/state'
	import { getPlatform } from '$lib/app/context.svelte'
	import { swipeController } from '$lib/navigation/swipe.svelte'
	import ToastContainer from '$lib/ui/features/toasts/ToastContainer.svelte'

	interface Props {
		navbar?: Snippet
		children?: Snippet
	}

	const { navbar, children }: Props = $props()
	const platform = getPlatform()

	$effect(() => {
		swipeController.init(platform)
		return () => swipeController.destroy()
	})

	$effect(() => swipeController.setPath(page.url.pathname))
</script>

<ToastContainer />

<div class="shell-layout">
	<div class="viewport-constrain">
		<!--
           pan-y explicitly to hint the browser
           that horizontal gestures are ours, improving the scrollbar fight
        -->
		<main class="content-scroller">
			<div class="content-padder">
				{@render children?.()}
			</div>
		</main>

		{#if navbar}
			{@render navbar()}
		{/if}
	</div>
</div>

<style>
	.shell-layout {
		min-height: 100dvh;
		display: flex;
		justify-content: center;
		background-color: var(--color-bg);
		/* prevent horizontal scroll at root level */
		overflow: hidden;
	}

	.viewport-constrain {
		width: 100%;
		max-width: 600px;
		position: relative;
		/* crucial: clean stacking context */
		z-index: 1;
		display: flex;
		flex-direction: column;
		height: 100dvh;
		background: var(--color-bg);
	}

	.content-scroller {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden; /* kill the horizontal scrollbar */
		overscroll-behavior-y: contain;
		position: relative;

		/* hint for swipe handler */
		touch-action: pan-y;

		scrollbar-width: none;
		-ms-overflow-style: none;

		/* transition group */
		view-transition-name: page;
	}

	.content-scroller::-webkit-scrollbar {
		display: none;
	}

	.content-padder {
		/* increased bottom padding to account for floating navbar + safety */
		padding: var(--safe-top) max(var(--safe-right), 16px) calc(90px + var(--safe-bottom))
			max(var(--safe-left), 16px);
		min-height: 100%;
	}

	:global(html) {
		background: var(--color-bg);
		/* prevents rubber-banding on ios body */
		overscroll-behavior: none;
	}
</style>
