<script lang="ts">
	import { CheckCircle, Receipt } from 'phosphor-svelte'
	import { cubicOut } from 'svelte/easing'
	import { fly, scale } from 'svelte/transition'

	import { Emoji, Spinner } from '$lib/ui/components'

	interface Props {
		storeName?: string
		storeEmoji?: string
		status?: string
		itemsLoaded?: number
		totalItems?: number
		lastScannedItem?: string
		complete?: boolean
	}

	const {
		storeName,
		storeEmoji,
		status = 'Загрузка...',
		itemsLoaded = 0,
		totalItems,
		lastScannedItem,
		complete = false
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
	const isIndeterminate = $derived(!totalItems && status === 'Распознавание...')
	const hasProgress = $derived(((totalItems && totalItems > 0) || isIndeterminate) && !complete)
	const progressPercent = $derived(totalItems ? (itemsLoaded / totalItems) * 100 : 0)
</script>

<div class="receipt-loader">
	<div class="header">
		<div class="icon">
			{#if storeEmoji}
				<Emoji emoji={storeEmoji} size={24} />
			{:else}
				<Receipt size={24} weight="duotone" />
			{/if}
		</div>
		<div class="info">
			<span class="title">{storeName ?? 'Загрузка чека'}</span>
			<span class="status">{status}</span>
		</div>
		<div class="status-indicator">
			{#if complete}
				<div
					class="success-icon"
					in:scale={{ duration: 200, start: 0.5, easing: cubicOut }}
				>
					<CheckCircle size={24} weight="fill" color="var(--color-success)" />
				</div>
			{:else}
				<Spinner size="sm" />
			{/if}
		</div>
	</div>

	{#if hasProgress}
		<div class="progress" out:fly={{ y: -5, duration: 200 }}>
			<div
				class="progress-bar"
				class:indeterminate={isIndeterminate}
				style:width={isIndeterminate ? '100%' : `${progressPercent}%`}
			></div>
		</div>
	{/if}

	{#if (countText || lastScannedItem) && !complete}
		<div class="progress-footer" out:fly={{ y: 5, duration: 200 }}>
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
		transition: border-color 0.3s ease;
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

	.status-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
	}

	.success-icon {
		display: flex;
		align-items: center;
		color: var(--color-success);
	}

	.progress {
		height: 4px;
		background: var(--color-bg-tertiary);
		border-radius: 2px;
		overflow: hidden;
		position: relative;
	}

	.progress-bar {
		height: 100%;
		background: var(--color-primary);
		transition: width 0.3s var(--ease-out);
	}

	.progress-bar.indeterminate {
		width: 30% !important;
		position: absolute;
		animation: indeterminate 1.5s infinite linear;
	}

	@keyframes indeterminate {
		0% {
			left: -30%;
		}
		100% {
			left: 100%;
		}
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
