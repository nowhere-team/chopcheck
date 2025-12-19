<script lang="ts">
	import { m } from '$lib/i18n'
	import type { Participant, PaymentMethod } from '$lib/services/api/types'
	import { AvatarStack, ExpandableCard } from '$lib/ui/components'
	import { PaymentMethodIcon } from '$lib/ui/features/payments'

	import { getSplitCreateContext } from './context.svelte'

	interface Props {
		participants: Participant[]
		paymentMethods: PaymentMethod[]
	}

	const { participants, paymentMethods }: Props = $props()
	const ctx = getSplitCreateContext()

	const participantStackItems = $derived(
		participants.map(p => ({
			id: p.id,
			name: p.displayName ?? p.user?.displayName ?? m.participants_anonymous(),
			url: p.user?.avatarUrl
		}))
	)

	function getTypeLabel(type: string): string {
		const labels: Record<string, string> = {
			sbp: 'СБП',
			card: 'Карта',
			phone: 'Телефон',
			bank_transfer: 'Перевод',
			cash: 'Наличные',
			crypto: 'Крипто',
			custom: 'Другое'
		}
		return labels[type] || type
	}

	function getMethodShortLabel(method: PaymentMethod): string {
		const data = method.paymentData as Record<string, string> | null
		const base = method.displayName || getTypeLabel(method.type)

		switch (method.type) {
			case 'sbp':
			case 'phone':
				if (data?.phone) {
					const phone = data.phone.replace(/\D/g, '')
					const short = phone.length > 4 ? `•••${phone.slice(-4)}` : data.phone
					return `${base} (${short})`
				}
				return base
			case 'card':
				if (data?.cardNumber) {
					return `${base} (••${data.cardNumber.slice(-4)})`
				}
				return base
			default:
				return base
		}
	}

	const paymentMethodsPreview = $derived(
		paymentMethods.length > 0
			? paymentMethods.map(m => getMethodShortLabel(m)).join(', ')
			: m.payment_method_not_selected()
	)
</script>

<div class="settings">
	<ExpandableCard
		title={m.split_participants_label()}
		onclick={() => ctx.sheets.open('participants')}
	>
		{#if participants.length === 0}
			<span>{m.participants_empty()}</span>
		{:else}
			<span>{participants.length} {m.participants_short()}</span>
		{/if}

		{#snippet preview()}
			{#if participants.length > 0}
				<AvatarStack items={participantStackItems} max={3} size={28} overlap={8} />
			{/if}
		{/snippet}
	</ExpandableCard>

	<ExpandableCard
		title={m.create_payment_method_title()}
		onclick={() => ctx.sheets.open('payment-methods')}
	>
		<span class="payment-preview-text">{paymentMethodsPreview}</span>

		{#snippet preview()}
			{#if paymentMethods.length > 0}
				<div class="payment-icons-stack">
					{#each paymentMethods.slice(0, 3) as method, i (method.id)}
						<div class="payment-icon-wrapper" style:z-index={3 - i}>
							<PaymentMethodIcon type={method.type} size={28} />
						</div>
					{/each}
					{#if paymentMethods.length > 3}
						<span class="more-badge">+{paymentMethods.length - 3}</span>
					{/if}
				</div>
			{/if}
		{/snippet}
	</ExpandableCard>
</div>

<style>
	.settings {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.payment-preview-text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.payment-icons-stack {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	.payment-icon-wrapper {
		position: relative;
		flex-shrink: 0;
	}

	.more-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: var(--color-bg-tertiary);
		border-radius: var(--radius-md);
		font-size: var(--text-xs);
		font-weight: var(--font-semibold);
		color: var(--color-text-secondary);
	}
</style>
