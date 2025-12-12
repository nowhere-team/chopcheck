<script lang="ts">
	import { m } from '$lib/i18n'
	import type { Split } from '$lib/services/api/types'
	import { formatPrice } from '$lib/shared/money'
	import { formatDate } from '$lib/shared/time'
	import { Avatar, Card } from '$lib/ui/components'

	interface Props {
		split: Split
		onclick?: () => void
	}

	const { split, onclick }: Props = $props()

	function getStatusText(split: Split): string {
		if (split.status === 'completed') return m.split_status_completed()
		if (split.status === 'draft') return m.split_status_setup()

		if (split.expectedParticipants) {
			const current = split.participants?.length || 0
			const waiting = split.expectedParticipants - current
			if (waiting > 0) return m.split_status_waiting({ count: waiting })
		}

		switch (split.phase) {
			case 'voting':
				return m.split_status_voting()
			case 'payment':
				return m.split_status_payment()
			case 'confirming':
				return m.split_status_confirming()
			default:
				return m.split_status_setup()
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
		<Avatar name={split.name} id={split.id} icon={split.icon} variant="plain" size={40} />

		<div class="info">
			<span class="name">{split.name}</span>
			<span class="status">{getStatusText(split)}</span>
		</div>

		<div class="meta">
			<span class="amount">
				{formatPrice(totalAmount(), split.currency)}
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
		font-size: var(--text-sm);
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
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		color: var(--color-text);
		font-variant-numeric: tabular-nums;
	}

	.date {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
	}
</style>
