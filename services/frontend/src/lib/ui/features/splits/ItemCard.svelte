<script lang="ts">
	import { Check } from 'phosphor-svelte'

	import { getPlatform } from '$lib/app/context.svelte'
	import { m } from '$lib/i18n'
	import type { SplitItem, WarningCode } from '$lib/services/api/types'
	import { formatPrice } from '$lib/shared/money'
	import { dismissWarning, getDismissedCodes } from '$lib/state/stores/dismissed.svelte'
	import { Avatar, Card } from '$lib/ui/components'
	import WarningAlert from '$lib/ui/features/splits/WarningAlert.svelte'
	import WarningBadge from '$lib/ui/features/splits/WarningBadge.svelte'

	interface Props {
		item: SplitItem
		splitId: string
		selected?: boolean
		selectionMode?: boolean
		onclick?: () => void
		onlongpress?: () => void
	}

	const {
		item,
		splitId,
		selected = false,
		selectionMode = false,
		onclick,
		onlongpress
	}: Props = $props()

	const platform = getPlatform()

	let longPressTimer: ReturnType<typeof setTimeout> | null = null
	let isLongPress = false

	const divisionLabels: Record<string, string> = {
		equal: m.division_method_equal(),
		shares: m.division_method_shares(),
		by_fraction: m.division_method_shares(),
		per_unit: m.division_method_per_unit(),
		by_amount: m.division_method_by_amount(),
		custom: m.division_method_custom(),
		fixed: m.division_method_fixed(),
		proportional: m.division_method_proportional()
	}

	const unitLabels: Record<string, string> = {
		piece: m.quantity_measurement_short(),
		g: 'г',
		kg: 'кг',
		ml: 'мл',
		l: 'л',
		pack: 'уп',
		portion: 'порц',
		set: 'сет'
	}

	const formattedQuantity = $derived(parseFloat(item.quantity).toString())
	const unitLabel = $derived(unitLabels[item.unit || 'piece'] || item.unit || '')

	const dismissedCodes = $derived(getDismissedCodes(splitId, item.id))

	const visibleWarnings = $derived(
		(item.warnings ?? []).filter(w => !dismissedCodes.includes(w.code))
	)
	const hasVisibleWarnings = $derived(visibleWarnings.length > 0)

	function handleClick(e: MouseEvent) {
		if (isLongPress) {
			isLongPress = false
			e.preventDefault()
			e.stopPropagation()
			return
		}
		platform.haptic.impact('light')
		onclick?.()
	}

	function handleTouchStart() {
		isLongPress = false
		longPressTimer = setTimeout(() => {
			isLongPress = true
			platform.haptic.impact('medium')
			onlongpress?.()
		}, 500)
	}

	function handleTouchEnd() {
		if (longPressTimer) {
			clearTimeout(longPressTimer)
			longPressTimer = null
		}
	}

	function handleTouchMove() {
		if (longPressTimer) {
			clearTimeout(longPressTimer)
			longPressTimer = null
		}
	}

	function handleContextMenu(e: Event) {
		e.preventDefault()
	}

	function handleDismissWarning(code: WarningCode) {
		dismissWarning(splitId, code, item.id)
	}
</script>

<div class="item-card-wrapper" oncontextmenu={handleContextMenu} role="presentation">
	<Card
		interactive
		onclick={handleClick}
		class="item-card no-callout {hasVisibleWarnings ? 'has-warnings' : ''}"
		ontouchstart={handleTouchStart}
		ontouchend={handleTouchEnd}
		ontouchmove={handleTouchMove}
	>
		<div class="card-content">
			<div class="avatar-wrapper">
				<Avatar
					name={item.name}
					id={item.id}
					icon={item.icon ?? '📦'}
					variant="plain"
					size={40}
				/>
				{#if selectionMode}
					<div class="selection-indicator" class:selected>
						{#if selected}
							<Check size={14} weight="bold" />
						{/if}
					</div>
				{/if}
			</div>

			<div class="info">
				<span class="name">{item.name}</span>
				<span class="meta">
					{formattedQuantity}
					{unitLabel} · {divisionLabels[item.defaultDivisionMethod] ??
						item.defaultDivisionMethod}
				</span>
			</div>

			<div class="right-section">
				{#if hasVisibleWarnings}
					<WarningBadge count={visibleWarnings.length} size={18} />
				{/if}
				<div class="price">
					{formatPrice(item.price)}
				</div>
			</div>
		</div>

		{#if hasVisibleWarnings}
			<div class="warnings-section">
				<WarningAlert warnings={visibleWarnings} compact onDismiss={handleDismissWarning} />
			</div>
		{/if}
	</Card>
</div>

<style>
	.item-card-wrapper {
		display: contents;
	}

	:global(.item-card) {
		padding: var(--space-3) var(--space-4) !important;
		transition:
			transform 0.15s var(--ease-out),
			background 0.15s var(--ease-out);
		user-select: none;
		-webkit-user-select: none;
		contain: content;
	}

	:global(.item-card.has-warnings) {
		padding-bottom: var(--space-2) !important;
	}

	:global(.item-card.no-callout) {
		-webkit-touch-callout: none !important;
	}

	.card-content {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.avatar-wrapper {
		position: relative;
		flex-shrink: 0;
	}

	.selection-indicator {
		position: absolute;
		bottom: -2px;
		right: -2px;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--color-bg-secondary);
		border: 2px solid var(--color-bg);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s var(--ease-out);
		animation: pop-in 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	@keyframes pop-in {
		from {
			transform: scale(0);
		}
		to {
			transform: scale(1);
		}
	}

	.selection-indicator.selected {
		background: var(--color-primary);
		color: var(--color-primary-text);
	}

	.info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.name {
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meta {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
	}

	.right-section {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--space-1);
		flex-shrink: 0;
	}

	.price {
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		color: var(--color-text);
		font-variant-numeric: tabular-nums;
	}

	.warnings-section {
		margin-top: var(--space-2);
	}
</style>
