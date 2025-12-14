<script lang="ts">
	import { Check } from 'phosphor-svelte'

	import { getPlatform } from '$lib/app/context.svelte'
	import { m } from '$lib/i18n'
	import type { SplitItem } from '$lib/services/api/types'
	import { formatPrice } from '$lib/shared/money'
	import { Avatar, Card } from '$lib/ui/components'

	interface Props {
		item: SplitItem
		selected?: boolean
		selectionMode?: boolean
		onclick?: () => void
		onlongpress?: () => void
	}

	const { item, selected = false, selectionMode = false, onclick, onlongpress }: Props = $props()
	const platform = getPlatform()

	let longPressTimer: ReturnType<typeof setTimeout> | null = null
	let isLongPress = false

	const divisionLabels: Record<string, string> = {
		equal: m.division_method_equal(),
		shares: m.division_method_shares(),
		custom: m.division_method_custom(),
		fixed: m.division_method_fixed?.() ?? 'Фикс.',
		proportional: m.division_method_proportional?.() ?? 'Процент'
	}

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
</script>

<div class="item-card-wrapper" oncontextmenu={handleContextMenu} role="presentation">
	<Card
		interactive
		onclick={handleClick}
		class="item-card no-callout"
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
					<!-- Добавлена анимация появления -->
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
					{item.quantity} шт. · {divisionLabels[item.defaultDivisionMethod] ??
						item.defaultDivisionMethod}
				</span>
			</div>

			<div class="price">
				{formatPrice(item.price)}
			</div>
		</div>
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
	.price {
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		color: var(--color-text);
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;
	}
</style>
