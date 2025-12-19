<script lang="ts">
	import { Plus, Wallet } from 'phosphor-svelte'
	import { SvelteSet } from 'svelte/reactivity'

	import { getPlatform } from '$lib/app/context.svelte'
	import type { CreatePaymentMethodDto, PaymentMethod } from '$lib/services/api/types'
	import { getPaymentMethodsService } from '$lib/state/context'
	import { Button } from '$lib/ui/components'
	import { toast } from '$lib/ui/features/toasts'
	import { BottomSheet } from '$lib/ui/overlays'

	import PaymentMethodCard from './PaymentMethodCard.svelte'
	import PaymentMethodEditSheet from './PaymentMethodEditSheet.svelte'

	interface Props {
		open: boolean
		splitId?: string
		selectedIds?: Set<string>
		onclose?: () => void
		onchange?: (selectedIds: Set<string>) => void
	}

	let {
		open = $bindable(),
		splitId,
		selectedIds = new Set(),
		onclose,
		onchange
	}: Props = $props()

	const platform = getPlatform()
	const paymentMethodsService = getPaymentMethodsService()

	const methods = $derived(paymentMethodsService.list.current ?? [])
	const isLoading = $derived(paymentMethodsService.list.loading)

	let localSelectedIds = $state<Set<string>>(new Set())
	let isEditSheetOpen = $state(false)
	let editingMethod = $state<PaymentMethod | null>(null)
	let wasOpen = $state(false)

	// Инициализируем localSelectedIds только при открытии sheet (переход из closed в open)
	$effect(() => {
		if (open && !wasOpen) {
			localSelectedIds = new SvelteSet(selectedIds)
		}
		wasOpen = open
	})

	function toggleSelection(id: string) {
		const newSet = new SvelteSet(localSelectedIds)
		if (newSet.has(id)) {
			newSet.delete(id)
		} else {
			newSet.add(id)
		}
		localSelectedIds = newSet
		platform.haptic.selection()
	}

	async function handleConfirm() {
		// если есть splitId, сохраняем методы в сплит
		if (splitId) {
			try {
				const currentMethods = paymentMethodsService.splitMethods.current ?? []
				const currentIds = new Set(currentMethods.map(m => m.paymentMethodId))

				// добавляем новые
				for (const id of localSelectedIds) {
					if (!currentIds.has(id)) {
						await paymentMethodsService.addToSplit(splitId, id)
					}
				}

				// удаляем убранные
				for (const id of currentIds) {
					if (!localSelectedIds.has(id)) {
						await paymentMethodsService.removeFromSplit(splitId, id)
					}
				}
			} catch {
				toast.error('Не удалось сохранить способы оплаты')
			}
		}

		onchange?.(localSelectedIds)
		open = false
		platform.haptic.impact('light')
	}

	function handleAddNew() {
		editingMethod = null
		isEditSheetOpen = true
		platform.haptic.impact('light')
	}

	function handleEdit(method: PaymentMethod) {
		editingMethod = method
		isEditSheetOpen = true
	}

	async function handleDelete(method: PaymentMethod) {
		try {
			await paymentMethodsService.delete(method.id)
			const newSet = new SvelteSet(localSelectedIds)
			newSet.delete(method.id)
			localSelectedIds = newSet
			toast.success('Способ оплаты удален')
		} catch {
			toast.error('Не удалось удалить')
		}
	}

	async function handleSave(data: CreatePaymentMethodDto) {
		try {
			if (editingMethod?.id) {
				await paymentMethodsService.update(editingMethod.id, {
					displayName: data.displayName,
					isDefault: data.isDefault
				})
				toast.success('Сохранено')
			} else {
				const created = await paymentMethodsService.create(data)
				localSelectedIds = new SvelteSet([...localSelectedIds, created.id])
				toast.success('Способ оплаты добавлен')
			}
			isEditSheetOpen = false
			editingMethod = null
		} catch {
			toast.error('Не удалось сохранить')
		}
	}

	async function handleDeleteFromEdit() {
		if (!editingMethod) return
		await handleDelete(editingMethod)
		isEditSheetOpen = false
		editingMethod = null
	}

	const selectedCount = $derived(localSelectedIds.size)
	const hasChanges = $derived(
		selectedIds.size !== localSelectedIds.size ||
			[...selectedIds].some(id => !localSelectedIds.has(id))
	)
</script>

<BottomSheet bind:open {onclose} title="Способы оплаты">
	<div class="sheet-content">
		{#if isLoading}
			<div class="loading">Загрузка...</div>
		{:else if methods.length === 0}
			<div class="empty">
				<Wallet size={48} weight="duotone" />
				<h3>Нет способов оплаты</h3>
				<p>Добавьте способ оплаты, чтобы друзья могли перевести вам деньги</p>
			</div>
		{:else}
			<div class="methods-list">
				{#each methods as method (method.id)}
					<PaymentMethodCard
						{method}
						selectable
						selected={localSelectedIds.has(method.id)}
						onselect={() => toggleSelection(method.id)}
						onedit={() => handleEdit(method)}
						ondelete={() => handleDelete(method)}
					/>
				{/each}
			</div>
		{/if}

		<div class="actions">
			<Button variant="secondary" onclick={handleAddNew}>
				{#snippet iconLeft()}
					<Plus size={20} />
				{/snippet}
				Добавить способ
			</Button>

			{#if methods.length > 0}
				<Button
					variant="primary"
					onclick={handleConfirm}
					disabled={!hasChanges && selectedCount === 0}
				>
					{selectedCount > 0 ? `Выбрать (${selectedCount})` : 'Подтвердить'}
				</Button>
			{/if}
		</div>
	</div>
</BottomSheet>

<PaymentMethodEditSheet
	bind:open={isEditSheetOpen}
	method={editingMethod}
	onclose={() => (isEditSheetOpen = false)}
	onsave={handleSave}
	ondelete={handleDeleteFromEdit}
/>

<style>
	.sheet-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding-bottom: var(--space-4);
		min-height: 200px;
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-8);
		color: var(--color-text-tertiary);
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-6) var(--space-4);
		text-align: center;
		color: var(--color-text-tertiary);
	}

	.empty h3 {
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		color: var(--color-text-secondary);
		margin: 0;
	}

	.empty p {
		font-size: var(--text-sm);
		margin: 0;
	}

	.methods-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-top: var(--space-2);
	}
</style>
