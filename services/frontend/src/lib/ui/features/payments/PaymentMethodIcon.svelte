<script lang="ts">
	import { Bank, CreditCard, CurrencyBtc, Lightning, Money, Phone, Wallet } from 'phosphor-svelte'
	import type { Component } from 'svelte'

	import type { PaymentMethodType } from '$lib/services/api/types'
	import { Icon } from '$lib/ui/components'

	interface Props {
		type: PaymentMethodType
		size?: number
	}

	const { type, size = 40 }: Props = $props()

	const iconMap: Record<PaymentMethodType, { icon: Component; color: string }> = {
		sbp: { icon: Lightning, color: '#7B3AED' },
		card: { icon: CreditCard, color: '#3B82F6' },
		phone: { icon: Phone, color: '#10B981' },
		bank_transfer: { icon: Bank, color: '#F59E0B' },
		cash: { icon: Money, color: '#22C55E' },
		crypto: { icon: CurrencyBtc, color: '#F97316' },
		custom: { icon: Wallet, color: '#6B7280' }
	}

	const config = $derived(iconMap[type] ?? iconMap.custom)
	const IconComponent = $derived(config.icon)
</script>

<Icon {size} variant="placard" color={config.color} shape="rounded">
	<IconComponent size={size * 0.5} weight="fill" />
</Icon>
