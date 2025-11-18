<script lang="ts">
	import type { Snippet } from 'svelte'
	import { onMount } from 'svelte'

	interface Props {
		speed?: number
		fadeWidth?: number
		children?: Snippet
	}

	const { speed = 30, fadeWidth = 15, children }: Props = $props()
	let contentRef: HTMLSpanElement | undefined = $state()
	let containerRef: HTMLDivElement | undefined = $state()
	let needsMarquee = $state(false)
	let duration = $state('0s')

	function checkOverflow() {
		if (!contentRef || !containerRef) return
		const overflow = contentRef.scrollWidth > containerRef.clientWidth
		needsMarquee = overflow
		if (speed > 0 && contentRef && overflow) {
			duration = `${contentRef.scrollWidth / speed}s`
		}
	}

	onMount(() => {
		checkOverflow()
		const resizeObserver = new ResizeObserver(() => {
			checkOverflow()
		})
		if (containerRef) resizeObserver.observe(containerRef)
		if (contentRef) resizeObserver.observe(contentRef)
		return () => resizeObserver.disconnect()
	})
</script>

<div class="marquee-outer" style="--fade-width: {fadeWidth}px;">
	<div class="marquee-inner" class:with-mask={needsMarquee} bind:this={containerRef}>
		{#if needsMarquee}
			<div class="marquee-track" style="--duration: {duration};">
				<span class="marquee-content" bind:this={contentRef}>
					{@render children?.()}
				</span>
				<span class="marquee-content" aria-hidden="true">
					{@render children?.()}
				</span>
				<span class="marquee-content" aria-hidden="true">
					{@render children?.()}
				</span>
				<span class="marquee-content" aria-hidden="true">
					{@render children?.()}
				</span>
			</div>
		{:else}
			<span class="marquee-content static" bind:this={contentRef}>
				{@render children?.()}
			</span>
		{/if}
	</div>
</div>

<style>
	.marquee-outer {
		width: 100%;
		min-width: 0;
		position: relative;
		contain: layout style;
	}

	.marquee-inner {
		width: 100%;
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
		position: relative;
	}

	.marquee-inner.with-mask {
		mask-image: linear-gradient(
			to right,
			transparent 0px,
			black var(--fade-width),
			black calc(100% - var(--fade-width)),
			transparent 100%
		);
		-webkit-mask-image: linear-gradient(
			to right,
			transparent 0px,
			black var(--fade-width),
			black calc(100% - var(--fade-width)),
			transparent 100%
		);
		mask-size: 100%;
		mask-repeat: no-repeat;
		-webkit-mask-size: 100%;
		-webkit-mask-repeat: no-repeat;
	}

	.marquee-track {
		display: inline-block;
		white-space: nowrap;
		animation: scroll var(--duration) linear infinite;
		will-change: transform;
		backface-visibility: hidden;
	}

	.marquee-content {
		display: inline-block;
		padding-right: 20px;
	}

	.marquee-content.static {
		padding-right: 0;
	}

	@keyframes scroll {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-25%);
		}
	}
</style>
