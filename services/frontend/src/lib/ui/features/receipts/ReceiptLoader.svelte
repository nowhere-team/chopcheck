<script lang="ts">
	import { Receipt } from 'phosphor-svelte'
	import { cubicOut } from 'svelte/easing'
	import { fly } from 'svelte/transition'

	import { Spinner } from '$lib/ui/components'

	interface Props {
		storeName?: string
		status?: string
		itemsLoaded?: number
		totalItems?: number
		lastScannedItem?: string
	}

	const {
		storeName,
		status = 'Загрузка...',
		itemsLoaded = 0,
		totalItems,
		lastScannedItem
	}: Props = $props()

	function formatCount(loaded: number, total?: number): string {
		if (total && total > 0) {
			return `${loaded} / ${total} позиций`
		}
		if (loaded > 0) {
			return `${loaded} позиций`
		}
		return ''
	}

	const countText = $derived(formatCount(itemsLoaded, totalItems))
	const hasProgress = $derived(totalItems && totalItems > 0)
	const progressPercent = $derived(hasProgress ? (itemsLoaded / totalItems!) * 100 : 0)
</script>

<div class="receipt-loader">
	<div class="header">
		<div class="icon">
			<Receipt size={24} weight="duotone" />
		</div>
		<div class="info">
			<span class="title">{storeName ?? 'Загрузка чека'}</span>
			<span class="status">{status}</span>
		</div>
		<Spinner size="sm" />
	</div>

	{#if hasProgress}
		<div class="progress">
			<div class="progress-bar" style:width="{progressPercent}%"></div>
		</div>
	{/if}

	{#if countText || lastScannedItem}
		<div class="progress-footer">
			{#if countText}
				<span class="progress-text">{countText}</span>
			{/if}

			{#if lastScannedItem}
				<div class="ticker-container">
					{#key lastScannedItem}
						<div
							class="ticker-item"
							in:fly={{ y: 8, duration: 200, easing: cubicOut }}
							out:fly={{ y: -8, duration: 200, easing: cubicOut }}
						>
							{lastScannedItem}
						</div>
					{/key}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.receipt-loader {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--color-bg-secondary);
		border-radius: var(--radius-lg);
		border: 1px dashed var(--color-border);
		overflow: hidden;
	}

	.header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
		color: var(--color-text-secondary);
	}

	.info {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.title {
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		color: var(--color-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.status {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
	}

	.progress {
		height: 4px;
		background: var(--color-bg-tertiary);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-bar {
		height: 100%;
		background: var(--color-primary);
		transition: width 0.3s var(--ease-out);
	}

	.progress-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-3);
		min-height: 20px;
	}

	.progress-text {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		flex-shrink: 0;
	}

	.ticker-container {
		position: relative;
		height: 20px;
		flex: 1;
		min-width: 0;
		display: flex;
		justify-content: flex-end;
		overflow: hidden;

		/*noinspection CssInvalidPropertyValue*/
		-webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 100%);
		mask-image: linear-gradient(to right, transparent, black 10%, black 100%);
	}

	.ticker-item {
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
		white-space: nowrap;
		position: absolute;
		right: 0;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
