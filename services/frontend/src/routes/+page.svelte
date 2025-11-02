<script lang="ts">
	import { onMount } from 'svelte'

	import { goto } from '$app/navigation'
	import CollapsibleSection from '$components/CollapsibleSection.svelte'
	import Spinner from '$components/Spinner.svelte'
	import SplitCard from '$components/SplitCard.svelte'
	import StatisticsBox from '$components/StatisticsBox.svelte'
	import { getActiveSplitsContext } from '$lib/contexts/active-splits.svelte'
	import { getStatsContext } from '$lib/contexts/stats.svelte'
	import { m } from '$lib/i18n'

	const stats = getStatsContext()
	const activeSplits = getActiveSplitsContext()

	onMount(() => {
		stats.fetch()
		activeSplits.fetch()
	})

	function handleSplitClick(splitId: string) {
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`/split/${splitId}`)
	}
</script>

<div class="page">
	<h1 class="title">{m.app_title_home()}</h1>

	{#if stats.isLoading && !stats.data}
		<div class="stats-loading">
			<Spinner size="md" />
		</div>
	{:else if stats.error}
		<div class="stats-error">
			<p>{m.stats_loading_error()}</p>
		</div>
	{:else if stats.data}
		<div class="stats">
			<StatisticsBox label={m.stats_total_splits()} value={stats.data.totalJoinedSplits} />
			<StatisticsBox
				label={m.stats_monthly_spent()}
				value={`${stats.data.monthlySpent.toLocaleString('ru-RU')} ₽`}
			/>
		</div>
	{/if}

	<CollapsibleSection title={m.section_your_splits()} count={activeSplits.splits.length}>
		{#if activeSplits.isLoading}
			<div class="section-loading">
				<Spinner size="sm" />
			</div>
		{:else if activeSplits.error}
			<p class="error">{activeSplits.error}</p>
		{:else if activeSplits.splits.length === 0}
			<p class="empty">{m.empty_active_splits()}</p>
		{:else}
			<div class="splits-list">
				{#each activeSplits.splits as split (split.id)}
					<SplitCard {split} onclick={() => handleSplitClick(split.id)} />
				{/each}
			</div>
		{/if}
	</CollapsibleSection>
</div>

<style>
	.stats {
		width: 100%;
		display: flex;
		gap: var(--spacing-2-m);
	}

	.stats-loading,
	.stats-error,
	.section-loading {
		display: flex;
		justify-content: center;
		padding: var(--spacing-6-m);
	}

	.error,
	.empty {
		/*text-align: center;*/
		/*padding: var(--spacing-6-m);*/
		color: var(--color-text-tertiary);
	}

	.splits-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2-m);
	}
</style>
