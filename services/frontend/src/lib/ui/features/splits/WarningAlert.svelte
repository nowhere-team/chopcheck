<script lang="ts">
	import { Warning, X } from 'phosphor-svelte'
	import { slide } from 'svelte/transition'

	import type { Warning as WarningType, WarningCode } from '$lib/services/api/types'

	interface Props {
		warnings: WarningType[]
		dismissible?: boolean
		compact?: boolean
		onDismiss?: (code: WarningCode) => void
	}

	const { warnings, dismissible = true, compact = false, onDismiss }: Props = $props()

	const warningLabels: Record<WarningCode, string> = {
		low_confidence_item: 'Низкая уверенность распознавания',
		possible_ocr_error: 'Возможная ошибка распознавания',
		price_anomaly: 'Необычная цена',
		missing_price: 'Цена не найдена',
		missing_quantity: 'Количество не найдено',
		multiple_alcohol_items: 'Несколько алкогольных позиций',
		total_mismatch: 'Сумма не сходится',
		unknown_category: 'Неизвестная категория',
		duplicate_item: 'Возможный дубликат',
		incomplete_place_data: 'Неполные данные о магазине',
		unreadable_receipt: 'Чек плохо читается',
		partial_extraction: 'Распознано частично'
	}

	function handleDismiss(code: WarningCode, e: MouseEvent) {
		e.stopPropagation()
		onDismiss?.(code)
	}
</script>

{#if warnings.length > 0}
	<div class="warning-alert" class:compact transition:slide={{ duration: 150 }}>
		{#each warnings as warning (warning.code)}
			<div class="warning-item" transition:slide={{ duration: 150 }}>
				<Warning size={compact ? 14 : 16} weight="fill" class="warning-icon" />
				<div class="warning-content">
					<span class="warning-text">
						{warningLabels[warning.code] ?? warning.code}
					</span>
					{#if warning.details}
						<span class="warning-details">{warning.details}</span>
					{/if}
				</div>
				{#if dismissible}
					<button
						type="button"
						class="dismiss-btn"
						onclick={e => handleDismiss(warning.code, e)}
						aria-label="Скрыть"
					>
						<X size={compact ? 12 : 14} weight="bold" />
					</button>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	.warning-alert {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-2) var(--space-3);
		background: color-mix(in srgb, #f59e0b 12%, transparent);
		border-radius: var(--radius-md);
		border: 1px solid color-mix(in srgb, #f59e0b 25%, transparent);
	}

	.warning-alert.compact {
		padding: var(--space-1) var(--space-2);
		gap: 2px;
	}

	.warning-item {
		display: flex;
		align-items: flex-start;
		gap: var(--space-2);
	}

	.warning-alert.compact .warning-item {
		gap: var(--space-1);
	}

	.warning-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	:global(.warning-icon) {
		color: #d97706;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.warning-text {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		line-height: 1.4;
	}

	.warning-alert.compact .warning-text {
		font-size: var(--text-xs);
	}

	.warning-details {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		line-height: 1.4;
	}

	.warning-alert.compact .warning-details {
		font-size: 10px;
	}

	.dismiss-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		border-radius: var(--radius-sm);
		color: var(--color-text-tertiary);
		cursor: pointer;
		transition: all 0.15s var(--ease-out);
		flex-shrink: 0;
	}

	.warning-alert.compact .dismiss-btn {
		width: 16px;
		height: 16px;
	}

	.dismiss-btn:hover {
		background: color-mix(in srgb, #f59e0b 20%, transparent);
		color: #d97706;
	}

	.dismiss-btn:active {
		transform: scale(0.9);
	}
</style>
