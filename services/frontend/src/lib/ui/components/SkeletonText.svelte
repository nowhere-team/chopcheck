<script lang="ts">
	import Skeleton from './Skeleton.svelte'

	interface Props {
		lines?: number
		lastLineWidth?: string
	}

	const { lines = 3, lastLineWidth = '60%' }: Props = $props()
</script>

<div class="skeleton-text">
	{#each Array(lines) as _, i (i)}
		<Skeleton height="14px" width={i === lines - 1 ? lastLineWidth : '100%'} />
	{/each}
</div>

<style>
	.skeleton-text {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
</style>
