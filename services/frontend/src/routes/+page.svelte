<script lang="ts">
	import { onMount } from 'svelte'

	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { getPlatform } from '$lib/app/context.svelte'
	import { formatPrice } from '$lib/shared/money'
	import { getSplitsStore, getUserStore } from '$lib/state'
	import { CollapsibleSection } from '$lib/ui/components'
	import Emoji from '$lib/ui/components/Emoji.svelte'
	import SplitCard from '$lib/ui/features/splits/SplitCard.svelte'
	import SplitCardSkeleton from '$lib/ui/features/splits/SplitCardSkeleton.svelte'
	import StatsBox from '$lib/ui/features/stats/StatsBox.svelte'
	import StatsSkeleton from '$lib/ui/features/stats/StatsSkeleton.svelte'
	import { toast } from '$lib/ui/features/toasts'
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
			toast.error('Не удалось обновить данные')
		}
	})

	function handleSplitClick(split: { id: string; shortId: string }) {
		platform.haptic.impact('light')
		goto(resolve('/splits/[id]', { id: split.shortId }))
	}
</script>

<Page title="Главная">
	<section class="stats-section">
		{#if isStatsLoading}
			<StatsSkeleton />
		{:else if stats.data}
			<div class="stats-grid">
				<StatsBox label="Всего сплитов" value={stats.data.totalJoinedSplits} />
				<StatsBox
					label="Потрачено в этом месяце"
					value={formatPrice(stats.data.monthlySpent)}
				/>
			</div>
		{/if}
	</section>

	<Emoji emoji="🥇" />
	<CollapsibleSection title="Активные сплиты" count={activeSplits.data?.length ?? 0}>
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
			<p class="empty-state">Нет активных сплитов</p>
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
