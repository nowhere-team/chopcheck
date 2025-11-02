<script lang="ts">
	import { onMount } from 'svelte'

	import { goto } from '$app/navigation'
	import Button from '$components/Button.svelte'
	import CollapsibleSection from '$components/CollapsibleSection.svelte'
	import Spinner from '$components/Spinner.svelte'
	import SplitCard from '$components/SplitCard.svelte'
	import { getSplitsHistoryContext } from '$lib/contexts/splits-history.svelte'
	import { m } from '$lib/i18n'

	const history = getSplitsHistoryContext()

	onMount(() => {
		history.fetch()
	})

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
</script>

<div class="page">
	<h1 class="title">{m.app_title_history()}</h1>

	{#if history.isLoading}
		<div class="loading">
			<Spinner size="lg" />
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
						{#each history.thisWeek as split (split.id)}
							<SplitCard {split} onclick={() => handleSplitClick(split.id)} />
						{/each}
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
						{#each history.thisMonth as split (split.id)}
							<SplitCard {split} onclick={() => handleSplitClick(split.id)} />
						{/each}
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
							<Button
								variant="secondary"
								onclick={() => history.loadMore()}
								loading={history.isLoadingMore}
							>
								{m.action_load_more()}
							</Button>
						{:else if history.earlier.length > 0}
							<p class="end">{m.all_splits_loaded()}</p>
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
	.loading,
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
	}
</style>
