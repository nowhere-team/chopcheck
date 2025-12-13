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

	{#if totalItems && totalItems > 0}
		<div class="progress">
			<div class="progress-bar" style:width="{(itemsLoaded / totalItems) * 100}%"></div>
		</div>
		<div class="progress-footer">
			<span class="progress-text">{itemsLoaded} / {totalItems} позиций</span>

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
		overflow: hidden; /* contain animations */
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
	}

	.title {
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		color: var(--color-text);
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
		min-height: 20px;
	}

	.progress-text {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
	}

	.ticker-container {
		position: relative;
		height: 20px;
		flex: 1;
		display: flex;
		justify-content: flex-end;
		overflow: hidden;

		/*noinspection CssInvalidPropertyValue*/
		-webkit-mask-image: linear-gradient(
			to bottom,
			transparent,
			black 15%,
			black 85%,
			transparent
		);

		mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
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
