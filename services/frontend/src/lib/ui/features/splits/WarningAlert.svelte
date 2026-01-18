<script lang="ts">
	import { Warning, X } from 'phosphor-svelte'
	import { slide } from 'svelte/transition'

	import { m } from '$lib/i18n'
	import type { Warning as WarningType, WarningCode } from '$lib/services/api/types'

	interface Props {
		warnings: WarningType[]
		dismissible?: boolean
		compact?: boolean
		onDismiss?: (code: WarningCode) => void
	}

	const { warnings, dismissible = true, compact = false, onDismiss }: Props = $props()

	const warningLabels: Record<WarningCode, string> = {
		low_confidence_item: m.warning_low_confidence_item(),
		possible_ocr_error: m.warning_possible_ocr_error(),
		price_anomaly: m.warning_price_anomaly(),
		missing_price: m.warning_missing_price(),
		missing_quantity: m.warning_missing_quantity(),
		multiple_alcohol_items: m.warning_multiple_alcohol_items(),
		total_mismatch: m.warning_total_mismatch(),
		unknown_category: m.warning_unknown_category(),
		duplicate_item: m.warning_duplicate_item(),
		incomplete_place_data: m.warning_incomplete_place_data(),
		unreadable_receipt: m.warning_unreadable_receipt(),
		partial_extraction: m.warning_partial_extraction()
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
						{warning.translated ?? warningLabels[warning.code] ?? warning.code}
					</span>
					{#if warning.details && !warning.translated}
						<span class="warning-details">{warning.details}</span>
					{/if}
				</div>
				{#if dismissible}
					<button
						type="button"
						class="dismiss-btn"
						onclick={e => handleDismiss(warning.code, e)}
						aria-label={m.warning_dismiss_label()}
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
