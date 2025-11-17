<script lang="ts">
	import { onDestroy, onMount } from 'svelte'

	import { page } from '$app/stores'
	import Delimiter from '$components/Delimiter.svelte'
	import Emoji from '$components/Emoji.svelte'
	import Spinner from '$components/Spinner.svelte'
	import { getSplitById } from '$lib/api/splits'
	import type { Split } from '$lib/api/types'
	import { m } from '$lib/i18n'

	const splitId = $page.params.id

	let split = $state<Split | null>(null)
	let loading = $state(true)
	let error = $state<string | null>(null)
	let eventSource: EventSource | null = null

	onMount(async () => {
		try {
			split = await getSplitById(splitId)
			loading = false

			// Connect to SSE for real-time updates
			connectSSE()
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load split'
			loading = false
		}
	})

	function connectSSE() {
		const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
		eventSource = new EventSource(`${apiUrl}/splits/${splitId}/subscribe`)

		eventSource.addEventListener('split-update', event => {
			try {
				const data = JSON.parse(event.data)
				if (data.type === 'update' || data.type === 'initial') {
					split = data.split.split
				}
			} catch (err) {
				console.error('Failed to parse SSE data:', err)
			}
		})

		eventSource.addEventListener('error', event => {
			console.error('SSE error:', event)
		})

		eventSource.onerror = () => {
			console.error('SSE connection error')
			// Reconnect after 5 seconds
			setTimeout(() => {
				if (eventSource) {
					eventSource.close()
					connectSSE()
				}
			}, 5000)
		}
	}

	onDestroy(() => {
		if (eventSource) {
			eventSource.close()
		}
	})

	const totalAmount = $derived(() => {
		if (!split?.items) return 0
		return split.items.reduce((sum, item) => sum + item.price * parseFloat(item.quantity), 0)
	})
</script>

{#if loading}
	<div class="page loading">
		<Spinner size="lg" />
		<p>{m.loading()}</p>
	</div>
{:else if error}
	<div class="page error">
		<h1>❌</h1>
		<p>{error}</p>
	</div>
{:else if split}
	<div class="page">
		<div class="header">
			<div class="icon-container">
				<Emoji emoji={split.icon || '💰'} size={48} />
			</div>
			<h1 class="title">{split.name}</h1>
			<div class="status">
				<span class="status-badge status-{split.status}">{split.status}</span>
				<span class="phase-badge">{split.phase}</span>
			</div>
		</div>

		<Delimiter />

		<div class="info-section">
			<div class="info-item">
				<span class="label">{m.split_id_label()}</span>
				<span class="value monospace">{split.shortId}</span>
			</div>
			<div class="info-item">
				<span class="label">{m.currency_label()}</span>
				<span class="value">{split.currency}</span>
			</div>
			<div class="info-item">
				<span class="label">{m.total_amount_label()}</span>
				<span class="value amount">{totalAmount()} {split.currency}</span>
			</div>
		</div>

		<Delimiter />

		{#if split.items && split.items.length > 0}
			<div class="items-section">
				<h2>{m.items_label()}</h2>
				<div class="items-list">
					{#each split.items as item (item.id)}
						<div class="item">
							<div class="item-info">
								<span class="item-name">{item.name}</span>
								<span class="item-quantity">×{item.quantity}</span>
							</div>
							<span class="item-price"
								>{item.price * parseFloat(item.quantity)} {split.currency}</span
							>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<Delimiter />

		{#if split.participants && split.participants.length > 0}
			<div class="participants-section">
				<h2>{m.participants_label()}</h2>
				<div class="participants-list">
					{#each split.participants as participant (participant.id)}
						<div class="participant">
							<span class="participant-name">
								{participant.user?.displayName ||
									participant.displayName ||
									'Unknown'}
							</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}

<style lang="scss">
	.page {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		min-height: 100vh;

		&.loading,
		&.error {
			justify-content: center;
			align-items: center;
			text-align: center;
		}
	}

	.header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 0;
	}

	.icon-container {
		width: 64px;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: var(--tg-theme-secondary-bg-color, #f0f0f0);
	}

	.title {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
		color: var(--tg-theme-text-color, #000);
	}

	.status {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.status-badge,
	.phase-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
	}

	.status-badge {
		&.status-draft {
			background: #fef3c7;
			color: #92400e;
		}

		&.status-active {
			background: #d1fae5;
			color: #065f46;
		}

		&.status-completed {
			background: #e0e7ff;
			color: #3730a3;
		}
	}

	.phase-badge {
		background: var(--tg-theme-secondary-bg-color, #f0f0f0);
		color: var(--tg-theme-text-color, #000);
	}

	.info-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
	}

	.label {
		font-size: 0.875rem;
		color: var(--tg-theme-hint-color, #999);
	}

	.value {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--tg-theme-text-color, #000);

		&.monospace {
			font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
			letter-spacing: 0.5px;
		}

		&.amount {
			font-size: 1rem;
			font-weight: 600;
		}
	}

	.items-section,
	.participants-section {
		h2 {
			font-size: 1rem;
			font-weight: 600;
			margin: 0 0 0.75rem 0;
			color: var(--tg-theme-text-color, #000);
		}
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: var(--tg-theme-secondary-bg-color, #f9f9f9);
		border-radius: 8px;
	}

	.item-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.item-name {
		font-size: 0.875rem;
		color: var(--tg-theme-text-color, #000);
	}

	.item-quantity {
		font-size: 0.75rem;
		color: var(--tg-theme-hint-color, #999);
	}

	.item-price {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--tg-theme-text-color, #000);
	}

	.participants-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.participant {
		padding: 0.75rem;
		background: var(--tg-theme-secondary-bg-color, #f9f9f9);
		border-radius: 8px;
	}

	.participant-name {
		font-size: 0.875rem;
		color: var(--tg-theme-text-color, #000);
	}
</style>
