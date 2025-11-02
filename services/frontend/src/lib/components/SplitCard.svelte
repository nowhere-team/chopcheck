<script lang="ts">
	import type { Split } from '$api/types'
	import Emoji from '$components/Emoji.svelte'
	import { m } from '$lib/i18n'

	interface Props {
		split: Split
		onclick?: () => void
	}

	const { split, onclick }: Props = $props()

	const currencySymbols: Record<string, string> = {
		RUB: '₽',
		USD: '$',
		EUR: '€'
	}

	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		const now = new Date()

		if (date.toDateString() === now.toDateString()) {
			return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
		}

		if (date.getFullYear() === now.getFullYear()) {
			return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
		}

		return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
	}

	const getStatusText = (split: Split) => {
		if (split.status === 'completed') {
			return m.split_status_completed()
		}

		if (split.expectedParticipants) {
			const waiting = split.expectedParticipants - (split.participants?.length || 0)
			if (waiting > 0) {
				return m.split_status_waiting({ count: waiting })
			}
		}

		if (split.phase === 'voting') return m.split_status_voting()
		if (split.phase === 'payment') return m.split_status_payment()
		if (split.phase === 'confirming') return m.split_status_confirming()
		if (split.phase === 'setup') return m.split_status_setup()

		return split.phase
	}

	const icon = $derived(split.icon || '🎯')

	const amount = $derived(() => {
		if (split.items?.length) {
			return split.items.reduce((sum, item) => sum + item.price, 0)
		}
		return 0
	})

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			onclick?.()
		}
	}
</script>

<div
	class="split-card"
	role="button"
	tabindex="0"
	{onclick}
	onkeydown={handleKeydown}
	aria-label={m.split_card_aria_label({ name: split.name })}
>
	<div class="icon" aria-hidden="true">
		<Emoji emoji={icon} size={35} />
	</div>

	<div class="content">
		<div class="info">
			<h3 class="name">{split.name}</h3>
			<p class="status">{getStatusText(split)}</p>
		</div>

		<div class="meta">
			<span class="amount">
				{amount().toLocaleString('ru-RU')}
				{currencySymbols[split.currency] || split.currency}
			</span>
			<time class="date" datetime={split.createdAt}>
				{formatDate(split.createdAt)}
			</time>
		</div>
	</div>
</div>

<style>
	.split-card {
		width: 100%;
		display: flex;
		gap: var(--spacing-3-m);
		padding: var(--spacing-4-m);
		background: var(--color-bg-surface);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-default);
		cursor: pointer;
		transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
		-webkit-tap-highlight-color: transparent;
	}

	.split-card:hover {
		background: var(--color-bg-surface-selected);
	}

	.split-card:active {
		transform: scale(0.99);
	}

	.split-card:focus-visible {
		outline: 2px solid var(--color-button-primary-bg);
		outline-offset: 2px;
	}

	.icon {
		flex-shrink: 0;
		width: 35px;
		height: 35px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.content {
		flex: 1;
		min-width: 0;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--spacing-3-m);
	}

	.info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-m);
	}

	.name {
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		color: var(--color-text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-align: left;
	}

	.status {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		text-align: left;
	}

	.meta {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--spacing-m);
	}

	.amount {
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		color: var(--color-text-primary);
		white-space: nowrap;
	}

	.date {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
		white-space: nowrap;
	}

	@media (hover: none) {
		.split-card:active {
			transform: scale(0.98);
		}
	}
</style>
