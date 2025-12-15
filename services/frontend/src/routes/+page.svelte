<script lang="ts">
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { getPlatform } from '$lib/app/context.svelte'
	import { m } from '$lib/i18n'
	import { formatPrice } from '$lib/shared/money'
	import { getSplitsService, getUserService } from '$lib/state/context'
	import SplitCard from '$lib/ui/features/splits/SplitCard.svelte'
	import SplitCardSkeleton from '$lib/ui/features/splits/SplitCardSkeleton.svelte'
	import StatsBox from '$lib/ui/features/stats/StatsBox.svelte'
	import StatsSkeleton from '$lib/ui/features/stats/StatsSkeleton.svelte'
	import { toast } from '$lib/ui/features/toasts'
	import { CollapsibleSection } from '$lib/ui/forms'
	import Page from '$lib/ui/layouts/Page.svelte'

	const platform = getPlatform()
	const userService = getUserService()
	const splitsService = getSplitsService()

	const stats = $derived(userService.stats)
	const activeSplits = $derived(splitsService.active)

	$effect(() => {
		if (stats.error || activeSplits.error) {
			toast.error(m.error_loading())
		}
	})

	function handleSplitClick(split: { shortId: string }) {
		platform.haptic.impact('light')
		goto(resolve('/splits/[id]', { id: split.shortId }))
	}
</script>

<Page title={m.app_title_home()}>
	<section class="stats-section">
		{#if stats.loading && !stats.current}
			<StatsSkeleton />
		{:else if stats.current}
			<div class="stats-grid">
				<StatsBox label={m.stats_total_splits()} value={stats.current.totalJoinedSplits} />
				<StatsBox
					label={m.stats_monthly_spent()}
					value={formatPrice(stats.current.monthlySpent)}
				/>
			</div>
		{/if}
	</section>

	<CollapsibleSection title={m.section_active_splits()} count={activeSplits.current?.length ?? 0}>
		{#if activeSplits.loading && !activeSplits.current}
			<div class="splits-list">
				<SplitCardSkeleton count={3} />
			</div>
		{:else if activeSplits.current && activeSplits.current.length > 0}
			<div class="splits-list">
				{#each activeSplits.current as split (split.id)}
					<SplitCard {split} onclick={() => handleSplitClick(split)} />
				{/each}
			</div>
		{:else if !activeSplits.loading}
			<p class="empty-state">{m.empty_active_splits()}</p>
		{/if}
	</CollapsibleSection>
</Page>

<style>
	.stats-section {
		margin-bottom: var(--space-2);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
	}

	.splits-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.empty-state {
		text-align: center;
		padding: var(--space-8) var(--space-4);
		color: var(--color-text-tertiary);
		font-size: var(--text-sm);
	}
</style>
