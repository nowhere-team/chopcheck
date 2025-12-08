<script lang="ts">
	import type { Split } from '$lib/services/api/types'

	import Avatar from './Avatar.svelte'
	import { Card } from './index'

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

	function formatDate(dateString: string): string {
		const date = new Date(dateString)
		const now = new Date()

		if (date.toDateString() === now.toDateString()) {
			return date.toLocaleTimeString('ru-RU', {
				hour: '2-digit',
				minute: '2-digit'
			})
		}

		if (date.getFullYear() === now.getFullYear()) {
			return date.toLocaleDateString('ru-RU', {
				day: 'numeric',
				month: 'short'
			})
		}

		return date.toLocaleDateString('ru-RU', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		})
	}

	function getStatusText(split: Split): string {
		if (split.status === 'completed') return 'завершён'
		if (split.status === 'draft') return 'черновик'

		if (split.expectedParticipants) {
			const current = split.participants?.length || 0
			const waiting = split.expectedParticipants - current
			if (waiting > 0) return `ожидаем ${waiting} чел.`
		}

		switch (split.phase) {
			case 'voting':
				return 'голосование'
			case 'payment':
				return 'оплата'
			case 'confirming':
				return 'подтверждение'
			default:
				return 'настройка'
		}
	}

	const totalAmount = $derived(() => {
		if (!split.items?.length) return 0
		return (
			split.items.reduce((sum, item) => sum + item.price * parseFloat(item.quantity), 0) / 100
		)
	})
</script>

<Card interactive {onclick} class="split-card">
	<div class="card-content">
		<Avatar name={split.name} id={split.id} size={40} />

		<div class="info">
			<span class="name">{split.name}</span>
			<span class="status">{getStatusText(split)}</span>
		</div>

		<div class="meta">
			<span class="amount">
				{totalAmount().toLocaleString('ru-RU')}
				{currencySymbols[split.currency] || split.currency}
			</span>
			<time class="date" datetime={split.createdAt}>
				{formatDate(split.createdAt)}
			</time>
		</div>
	</div>
</Card>

<style>
	:global(.split-card) {
		padding: var(--space-3) var(--space-4) !important;
	}

	.card-content {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.name {
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.status {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
	}

	.meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
		flex-shrink: 0;
	}

	.amount {
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
		color: var(--color-text);
		font-variant-numeric: tabular-nums;
	}

	.date {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
	}
</style>
