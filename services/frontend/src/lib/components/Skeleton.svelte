<script lang="ts">
	interface Props {
		width?: string
		height?: string
		circle?: boolean
		count?: number
		className?: string
	}

	const { width = '100%', height = '20px', circle = false, count = 1, className = '' }: Props = $props()
</script>

{#if count === 1}
	<div class="skeleton {className}" class:circle style="width: {width}; height: {height};"></div>
{:else}
	{#each Array(count) as _, i (i)}
		<div class="skeleton {className}" class:circle style="width: {width}; height: {height};"></div>
	{/each}
{/if}

<style>
	.skeleton {
		background: linear-gradient(
			90deg,
			var(--color-bg-surface-secondary) 0%,
			var(--color-bg-surface-selected) 50%,
			var(--color-bg-surface-secondary) 100%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s ease-in-out infinite;
		border-radius: var(--radius-default);
	}

	.skeleton.circle {
		border-radius: 50%;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
