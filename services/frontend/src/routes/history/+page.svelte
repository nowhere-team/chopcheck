<script lang="ts">
	import { onMount } from 'svelte'

	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { getPlatform } from '$lib/app/context.svelte'
	import { formatPrice } from '$lib/shared/money'
	import { getSplitsStore, getUserStore } from '$lib/state'
	import { CollapsibleSection, SplitCard, StatsBox } from '$lib/ui/components'
	import SplitCardSkeleton from '$lib/ui/components/SplitCardSkeleton.svelte'
	import StatsSkeleton from '$lib/ui/components/StatsSkeleton.svelte'
	import { toast } from '$lib/ui/features/toasts/toast.svelte'
	import Page from '$lib/ui/layouts/Page.svelte'

	const platform = getPlatform()
	const userStore = getUserStore()
	const splitsStore = getSplitsStore()

	// reactive access to store data
	const stats = $derived(userStore.stats)
	const activeSplits = $derived(splitsStore.active)

	onMount(() => {
		// fetch data on mount
		userStore.stats.fetch()
		splitsStore.active.fetch()
	})

	function handleSplitClick(split: { id: string; shortId: string }) {
		platform.haptic.impact('light')
		goto(resolve('/splits/[id]', { id: split.shortId }))
	}

	function handleError() {
		toast.error('Не удалось загрузить данные')
	}

	// watch for errors
	$effect(() => {
		if (stats.isError || activeSplits.isError) {
			handleError()
		}
	})
</script>

<Page title="Главная">
	<!-- Statistics Section -->
	<section class="stats-section">
		{#if stats.isLoading && !stats.data}
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

	<!-- Active Splits Section -->
	<CollapsibleSection title="Ваши сплиты" count={activeSplits.data?.length ?? 0}>
		{#if activeSplits.isLoading && !activeSplits.data}
			<div class="splits-list">
				<SplitCardSkeleton count={3} />
			</div>
		{:else if activeSplits.data && activeSplits.data.length > 0}
			<div class="splits-list">
				{#each activeSplits.data as split (split.id)}
					<SplitCard {split} onclick={() => handleSplitClick(split)} />
				{/each}
			</div>
		{:else}
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
