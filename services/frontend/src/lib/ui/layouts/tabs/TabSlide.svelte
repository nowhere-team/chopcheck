<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		children: Snippet
	}

	const { children }: Props = $props()
</script>

<div class="tab-slide">
	{@render children()}
</div>

<style>
	.tab-slide {
		flex: 0 0 100%;
		min-width: 0;
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		overscroll-behavior-y: contain;
	}
</style>
