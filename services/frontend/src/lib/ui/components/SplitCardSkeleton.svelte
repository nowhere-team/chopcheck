<script lang="ts">
	import Skeleton from './Skeleton.svelte'

	interface Props {
		count?: number
	}

	const { count = 1 }: Props = $props()
</script>

{#each Array(count) as _, i (i)}
	<div class="split-card-skeleton">
		<Skeleton circle width="40px" height="40px" />

		<div class="content">
			<div class="info">
				<Skeleton width="70%" height="16px" />
				<Skeleton width="40%" height="12px" />
			</div>

			<div class="meta">
				<Skeleton width="60px" height="16px" />
				<Skeleton width="50px" height="10px" />
			</div>
		</div>
	</div>
{/each}

<style>
	.split-card-skeleton {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.content {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-3);
	}

	.info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--space-2);
	}
</style>
