<script lang="ts">
	import { onMount } from 'svelte'

	interface Props {
		onIntersect: () => void
		threshold?: number
		rootMargin?: string
	}

	const { onIntersect, threshold = 0.1, rootMargin = '100px' }: Props = $props()

	let sentinel: HTMLDivElement | undefined

	onMount(() => {
		if (!sentinel) return

		const observer = new IntersectionObserver(
			entries => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						onIntersect()
					}
				})
			},
			{ threshold, rootMargin }
		)

		observer.observe(sentinel)

		return () => {
			observer.disconnect()
		}
	})
</script>

<div class="sentinel" bind:this={sentinel}></div>

<style>
	.sentinel {
		height: 1px;
		width: 100%;
		pointer-events: none;
	}
</style>
