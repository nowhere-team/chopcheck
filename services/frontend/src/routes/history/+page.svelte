<script lang="ts">
	import { onMount } from 'svelte'

	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { getPlatform } from '$lib/app/context.svelte'
	import { m } from '$lib/i18n'
	import { getSplitsStore } from '$lib/state'
	import SplitCard from '$lib/ui/features/splits/SplitCard.svelte'
	import SplitCardSkeleton from '$lib/ui/features/splits/SplitCardSkeleton.svelte'
	import { CollapsibleSection } from '$lib/ui/forms'
	import Page from '$lib/ui/layouts/Page.svelte'

	const platform = getPlatform()
	const splitsStore = getSplitsStore()

	const history = $derived(splitsStore.grouped)
	const data = $derived(history.data)
	const isHistoryLoading = $derived(history.isLoading && !data)

	onMount(() => {
		splitsStore.grouped.fetch()
	})

	function handleSplitClick(shortId: string) {
		platform.haptic.impact('light')
		goto(resolve('/splits/[id]', { id: shortId }))
	}
</script>

<Page title={m.app_title_history()}>
	{#if isHistoryLoading}
		<SplitCardSkeleton count={3} />
	{:else if data}
		<div class="sections">
			{#if data.thisWeek.length > 0}
				<CollapsibleSection title={m.section_this_week()} count={data.thisWeek.length}>
					<div class="list">
						{#each data.thisWeek as split (split.id)}
							<SplitCard {split} onclick={() => handleSplitClick(split.shortId)} />
						{/each}
					</div>
				</CollapsibleSection>
			{/if}

			{#if data.thisMonth.length > 0}
				<CollapsibleSection title={m.section_this_month()} count={data.thisMonth.length}>
					<div class="list">
						{#each data.thisMonth as split (split.id)}
							<SplitCard {split} onclick={() => handleSplitClick(split.shortId)} />
						{/each}
					</div>
				</CollapsibleSection>
			{/if}

			{#if data.earlier.length > 0}
				<CollapsibleSection
					title={m.section_earlier()}
					count={data.earlier.length}
					expanded={false}
				>
					<div class="list">
						{#each data.earlier as split (split.id)}
							<SplitCard {split} onclick={() => handleSplitClick(split.shortId)} />
						{/each}
					</div>
				</CollapsibleSection>
			{/if}

			{#if data.thisWeek.length === 0 && data.thisMonth.length === 0 && data.earlier.length === 0}
				<div class="empty-state">
					<p>{m.empty_all_splits()}</p>
				</div>
			{/if}
		</div>
	{/if}
</Page>

<style>
	.sections {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.list {
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
