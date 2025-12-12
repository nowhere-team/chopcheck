<script lang="ts">
	import { onMount } from 'svelte'

	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { getPlatform } from '$lib/app/context.svelte'
	import { m } from '$lib/i18n'
	import { formatPrice } from '$lib/shared/money'
	import { getSplitsStore, getUserStore } from '$lib/state'
	import SplitCard from '$lib/ui/features/splits/SplitCard.svelte'
	import SplitCardSkeleton from '$lib/ui/features/splits/SplitCardSkeleton.svelte'
	import StatsBox from '$lib/ui/features/stats/StatsBox.svelte'
	import StatsSkeleton from '$lib/ui/features/stats/StatsSkeleton.svelte'
	import { toast } from '$lib/ui/features/toasts'
	import { CollapsibleSection } from '$lib/ui/forms'
	import Page from '$lib/ui/layouts/Page.svelte'

	const platform = getPlatform()

	const userStore = getUserStore()
	const stats = $derived(userStore.stats)
	const isStatsLoading = $derived(stats.isLoading && !stats.data)

	const splitsStore = getSplitsStore()
	const activeSplits = $derived(splitsStore.active)
	const isSplitsLoading = $derived(activeSplits.isLoading && !activeSplits.data)

	onMount(() => {
		userStore.stats.fetch()
		splitsStore.active.fetch()
	})

	$effect(() => {
		if (stats.isError || activeSplits.isError) {
			toast.error(m.error_loading())
		}
	})

	function handleSplitClick(split: { id: string; shortId: string }) {
		platform.haptic.impact('light')
		goto(resolve('/splits/[id]', { id: split.shortId }))
	}
</script>

<Page title={m.app_title_home()}>
	<section class="stats-section">
		{#if isStatsLoading}
			<StatsSkeleton />
		{:else if stats.data}
			<div class="stats-grid">
				<StatsBox label={m.stats_total_splits()} value={stats.data.totalJoinedSplits} />
				<StatsBox
					label={m.stats_monthly_spent()}
					value={formatPrice(stats.data.monthlySpent)}
				/>
			</div>
		{/if}
	</section>

	<CollapsibleSection title={m.section_active_splits()} count={activeSplits.data?.length ?? 0}>
		{#if isSplitsLoading}
			<div class="splits-list">
				<SplitCardSkeleton count={3} />
			</div>
		{:else if activeSplits.data && activeSplits.data.length > 0}
			<div class="splits-list">
				{#each activeSplits.data as split (split.id)}
					<SplitCard {split} onclick={() => handleSplitClick(split)} />
				{/each}
			</div>
		{:else if !isSplitsLoading}
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
