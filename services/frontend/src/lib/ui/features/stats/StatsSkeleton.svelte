<script lang="ts">
	import { Card, Skeleton } from '$lib/ui/components'
</script>

<div class="stats-skeleton">
	<Card>
		<Skeleton width="100px" height="12px" />
		<Skeleton width="80px" height="24px" />
	</Card>

	<Card>
		<Skeleton width="120px" height="12px" />
		<Skeleton width="100px" height="24px" />
	</Card>
</div>

<style>
	.stats-skeleton {
		display: flex;
		gap: var(--space-3);
	}

	.stats-skeleton :global(.card) {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
</style>
