<script lang="ts">
	import { onMount } from 'svelte'

	import { goto } from '$app/navigation'
	import CollapsibleSection from '$components/CollapsibleSection.svelte'
	import IntersectionSentinel from '$components/IntersectionSentinel.svelte'
	import SplitCard from '$components/SplitCard.svelte'
	import SplitCardSkeleton from '$components/SplitCardSkeleton.svelte'
	import { getSplitsHistoryContext } from '$lib/contexts/splits-history.svelte'
	import { m } from '$lib/i18n'

	const history = getSplitsHistoryContext()

	onMount(() => {
		history.fetch()
	})

	const BATCH_SIZE = 10

	let thisWeekVisible = $state(BATCH_SIZE)
	let thisMonthVisible = $state(BATCH_SIZE)

	let thisWeekLoading = $state(false)
	let thisMonthLoading = $state(false)

	const thisWeekPaginated = $derived(history.thisWeek.slice(0, thisWeekVisible))
	const thisMonthPaginated = $derived(history.thisMonth.slice(0, thisMonthVisible))

	const hasMoreThisWeek = $derived(thisWeekVisible < history.thisWeek.length)
	const hasMoreThisMonth = $derived(thisMonthVisible < history.thisMonth.length)

	let thisMonthExpanded = $state(false)
	let earlierExpanded = $state(false)

	$effect(() => {
		if (history.thisWeek.length === 0) {
			thisMonthExpanded = true
		}
		if (history.thisWeek.length === 0 && history.thisMonth.length === 0) {
			earlierExpanded = true
		}
	})

	function handleSplitClick(splitId: string) {
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`/split/${splitId}`)
	}

	async function loadMoreThisWeek() {
		if (thisWeekLoading || !hasMoreThisWeek) return
		thisWeekLoading = true

		await new Promise(resolve => setTimeout(resolve, 100))

		thisWeekVisible = Math.min(thisWeekVisible + BATCH_SIZE, history.thisWeek.length)
		thisWeekLoading = false
	}

	async function loadMoreThisMonth() {
		if (thisMonthLoading || !hasMoreThisMonth) return
		thisMonthLoading = true

		await new Promise(resolve => setTimeout(resolve, 100))

		thisMonthVisible = Math.min(thisMonthVisible + BATCH_SIZE, history.thisMonth.length)
		thisMonthLoading = false
	}
</script>

<div class="page">
	<h1 class="title">{m.app_title_history()}</h1>

	{#if history.isLoading}
		<div class="sections">
			<div class="splits-list">
				<SplitCardSkeleton count={5} />
			</div>
		</div>
	{:else if history.error}
		<div class="error">
			<p>{history.error}</p>
		</div>
	{:else}
		<div class="sections">
			{#if history.thisWeek.length > 0}
				<CollapsibleSection title={m.section_this_week()} count={history.thisWeek.length}>
					<div class="splits-list">
						{#each thisWeekPaginated as split (split.id)}
							<SplitCard {split} onclick={() => handleSplitClick(split.id)} />
						{/each}

						{#if hasMoreThisWeek}
							{#if thisWeekLoading}
								<SplitCardSkeleton count={2} />
							{:else}
								<IntersectionSentinel onIntersect={loadMoreThisWeek} />
							{/if}
						{/if}
					</div>
				</CollapsibleSection>
			{/if}

			{#if history.thisMonth.length > 0}
				<CollapsibleSection
					title={m.section_this_month()}
					count={history.thisMonth.length}
					bind:expanded={thisMonthExpanded}
				>
					<div class="splits-list">
						{#each thisMonthPaginated as split (split.id)}
							<SplitCard {split} onclick={() => handleSplitClick(split.id)} />
						{/each}

						{#if hasMoreThisMonth}
							{#if thisMonthLoading}
								<SplitCardSkeleton count={2} />
							{:else}
								<IntersectionSentinel onIntersect={loadMoreThisMonth} />
							{/if}
						{/if}
					</div>
				</CollapsibleSection>
			{/if}

			{#if history.earlier.length > 0 || (history.thisWeek.length === 0 && history.thisMonth.length === 0)}
				<CollapsibleSection
					title={m.section_earlier()}
					count={history.earlier.length}
					bind:expanded={earlierExpanded}
				>
					<div class="splits-list">
						{#each history.earlier as split (split.id)}
							<SplitCard {split} onclick={() => handleSplitClick(split.id)} />
						{/each}

						{#if history.hasMore}
							{#if history.isLoadingMore}
								<SplitCardSkeleton count={3} />
							{:else}
								<IntersectionSentinel onIntersect={() => history.loadMore()} />
							{/if}
						{:else if history.earlier.length > 0}
							<p class="end">все сплиты загружены</p>
						{/if}
					</div>
				</CollapsibleSection>
			{/if}

			{#if history.thisWeek.length === 0 && history.thisMonth.length === 0 && history.earlier.length === 0}
				<p class="empty">{m.empty_all_splits()}</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.error {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 200px;
	}

	.sections {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4-m);
	}

	.splits-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2-m);
	}

	.empty,
	.end {
		text-align: center;
		padding: var(--spacing-6-m);
		color: var(--color-text-tertiary);
		font-size: var(--text-sm);
	}
</style>
