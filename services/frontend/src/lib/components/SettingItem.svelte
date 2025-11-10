<script lang="ts">
	import { CaretRight } from 'phosphor-svelte'
	import type { Snippet } from 'svelte'

	import SelectableCard from '$components/SelectableCard.svelte'

	interface Props {
		label: string
		sheetTitle: string
		sheetHeight?: number
		value?: Snippet
		sheet: Snippet
	}

	const { label, sheetTitle, sheetHeight = 60, value, sheet }: Props = $props()
</script>

<SelectableCard {sheetTitle} {sheetHeight} {sheet}>
	{#snippet content()}
		<div class="row">
			<div class="left">
				<span class="label">{label}</span>
				{#if value}
					<div class="value">
						{@render value()}
					</div>
				{/if}
			</div>
			<div class="right">
				<CaretRight size={24} color="var(--color-icon-default)" />
			</div>
		</div>
	{/snippet}
</SelectableCard>

<style>
	.row {
		display: flex;
		height: 56px;
		gap: var(--spacing-3-m);
	}

	.left {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		flex: 1;
		gap: var(--spacing-2-m);
		min-width: 0;
	}

	.right {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-shrink: 0;
	}

	.label {
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		color: var(--color-text-primary);
	}

	.value {
		display: flex;
	}
</style>
