<script lang="ts">
	import Skeleton from '$components/Skeleton.svelte'

	interface Props {
		count?: number
	}

	const { count = 1 }: Props = $props()
</script>

{#each Array(count) as _, i (i)}
	<div class="split-card-skeleton">
		<Skeleton circle width="35px" height="35px" />

		<div class="content">
			<div class="info">
				<Skeleton width="60%" height="18px" />
				<Skeleton width="40%" height="14px" />
			</div>

			<div class="meta">
				<Skeleton width="60px" height="18px" />
				<Skeleton width="50px" height="12px" />
			</div>
		</div>
	</div>
{/each}

<style>
	.split-card-skeleton {
		width: 100%;
		display: flex;
		align-items: center;
		gap: var(--spacing-3-m);
		padding: var(--spacing-4-m);
		background: var(--color-bg-surface);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-default);
	}

	.content {
		flex: 1;
		min-width: 0;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--spacing-3-m);
	}

	.info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2-m);
	}

	.meta {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--spacing-2-m);
	}
</style>
