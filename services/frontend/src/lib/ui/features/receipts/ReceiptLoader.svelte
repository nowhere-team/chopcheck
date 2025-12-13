<script lang="ts">
	import { Receipt } from 'phosphor-svelte'

	import { Spinner } from '$lib/ui/components'

	interface Props {
		storeName?: string
		status?: string
		itemsLoaded?: number
		totalItems?: number
	}

	const { storeName, status = 'Загрузка...', itemsLoaded = 0, totalItems }: Props = $props()
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
		<span class="progress-text">{itemsLoaded} / {totalItems} позиций</span>
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

	.progress-text {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		text-align: center;
	}
</style>
