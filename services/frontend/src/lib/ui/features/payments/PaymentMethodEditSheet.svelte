<script lang="ts">
	import { Trash } from 'phosphor-svelte'

	import { m } from '$lib/i18n'
	import type {
		CreatePaymentMethodDto,
		PaymentMethod,
		PaymentMethodType
	} from '$lib/services/api/types'
	import { Button, Checkbox, Divider, Input } from '$lib/ui/components'
	import { Select } from '$lib/ui/forms'
	import { BottomSheet } from '$lib/ui/overlays'

	interface Props {
		open: boolean
		method?: PaymentMethod | null
		onclose?: () => void
		onsave?: (data: CreatePaymentMethodDto) => void
		ondelete?: () => void
	}

	let { open = $bindable(), method = null, onclose, onsave, ondelete }: Props = $props()

	let type = $state<PaymentMethodType>('sbp')
	let displayName = $state('')
	let isDefault = $state(false)

	// sbp specific
	let phone = $state('')
	let bankName = $state('')

	// card specific
	let cardNumber = $state('')

	// bank_transfer specific
	let accountNumber = $state('')
	let bik = $state('')
	let recipientName = $state('')

	// crypto specific
	let walletAddress = $state('')
	let network = $state('')

	// universal comment
	let comment = $state('')

	const typeOptions = [
		{ value: 'sbp', label: 'СБП', description: 'Система быстрых платежей' },
		{ value: 'card', label: 'Банковская карта', description: 'Перевод по номеру карты' },
		{ value: 'phone', label: 'По номеру телефона', description: 'Перевод по номеру' },
		{ value: 'bank_transfer', label: 'Банковский перевод', description: 'По реквизитам' },
		{ value: 'cash', label: 'Наличные', description: 'Оплата наличными' },
		{ value: 'crypto', label: 'Криптовалюта', description: 'Перевод в крипте' },
		{ value: 'custom', label: 'Другое', description: 'Свой способ оплаты' }
	]

	const isEditing = $derived(!!method?.id)
	const title = $derived(isEditing ? 'Редактировать способ оплаты' : 'Новый способ оплаты')

	$effect(() => {
		if (open && method) {
			type = method.type
			displayName = method.displayName || ''
			isDefault = method.isDefault

			const data = method.paymentData as Record<string, string>
			phone = data?.phone || ''
			bankName = data?.bankName || ''
			cardNumber = data?.cardNumber || ''
			accountNumber = data?.accountNumber || ''
			bik = data?.bik || ''
			recipientName = data?.recipientName || ''
			walletAddress = data?.walletAddress || ''
			network = data?.network || ''
			comment = data?.comment || ''
		} else if (open && !method) {
			resetForm()
		}
	})

	function resetForm() {
		type = 'sbp'
		displayName = ''
		isDefault = false
		phone = ''
		bankName = ''
		cardNumber = ''
		accountNumber = ''
		bik = ''
		recipientName = ''
		walletAddress = ''
		network = ''
		comment = ''
	}

	function buildPaymentData(): Record<string, unknown> {
		const base: Record<string, unknown> = {}

		if (comment.trim()) {
			base.comment = comment.trim()
		}

		switch (type) {
			case 'sbp':
				return { ...base, phone, bankName }
			case 'card':
				return { ...base, cardNumber }
			case 'phone':
				return { ...base, phone }
			case 'bank_transfer':
				return { ...base, accountNumber, bik, recipientName }
			case 'crypto':
				return { ...base, walletAddress, network }
			case 'cash':
			case 'custom':
				return base
			default:
				return base
		}
	}

	function handleSave() {
		const data: CreatePaymentMethodDto = {
			type,
			displayName: displayName.trim() || undefined,
			paymentData: buildPaymentData(),
			isDefault
		}
		onsave?.(data)
	}

	function handleDelete() {
		ondelete?.()
	}
</script>

<BottomSheet bind:open {onclose} {title}>
	<div class="edit-form">
		<Select label="Тип" options={typeOptions} bind:value={type} />

		<Input label="Название (необязательно)" bind:value={displayName} placeholder="Мой Сбер" />

		{#if type === 'sbp'}
			<Input
				label="Номер телефона"
				bind:value={phone}
				placeholder="+7 999 123-45-67"
				type="tel"
				inputmode="tel"
			/>
			<Input label="Банк" bind:value={bankName} placeholder="Сбербанк" />
		{/if}

		{#if type === 'phone'}
			<Input
				label="Номер телефона"
				bind:value={phone}
				placeholder="+7 999 123-45-67"
				type="tel"
				inputmode="tel"
			/>
		{/if}

		{#if type === 'card'}
			<Input
				label="Номер карты"
				bind:value={cardNumber}
				placeholder="1234 5678 9012 3456"
				inputmode="numeric"
			/>
		{/if}

		{#if type === 'bank_transfer'}
			<Input
				label="Номер счета"
				bind:value={accountNumber}
				placeholder="40817810099910004312"
				inputmode="numeric"
			/>
			<Input label="БИК" bind:value={bik} placeholder="044525225" inputmode="numeric" />
			<Input
				label="Получатель"
				bind:value={recipientName}
				placeholder="Иванов Иван Иванович"
			/>
		{/if}

		{#if type === 'crypto'}
			<Input label="Адрес кошелька" bind:value={walletAddress} placeholder="0x..." />
			<Input label="Сеть" bind:value={network} placeholder="Ethereum, TRON, TON..." />
		{/if}

		{#if type === 'bank_transfer' || type === 'crypto' || type === 'cash' || type === 'custom'}
			<Input
				label="Комментарий / инструкция"
				bind:value={comment}
				placeholder="Дополнительная информация для отправителя..."
			/>
		{/if}

		<Checkbox bind:checked={isDefault} label="Использовать по умолчанию" />

		<Divider />

		<div class="actions">
			{#if isEditing}
				<Button variant="danger" onclick={handleDelete}>
					{#snippet iconLeft()}
						<Trash size={20} />
					{/snippet}
				</Button>
			{/if}
			<Button variant="primary" onclick={handleSave} class="save-btn">
				{isEditing ? m.action_save() : 'Добавить'}
			</Button>
		</div>
	</div>
</BottomSheet>

<style>
	.edit-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding-bottom: var(--space-4);
	}

	.actions {
		display: flex;
		gap: var(--space-3);
	}

	:global(.save-btn) {
		flex: 1;
	}
</style>
