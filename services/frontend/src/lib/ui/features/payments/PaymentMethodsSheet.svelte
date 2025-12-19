<script lang="ts">
	import { Plus, Wallet } from 'phosphor-svelte'
	import { SvelteSet } from 'svelte/reactivity'

	import { getPlatform } from '$lib/app/context.svelte'
	import type { CreatePaymentMethodDto, PaymentMethod } from '$lib/services/api/types'
	import { getPaymentMethodsService, getSplitsService } from '$lib/state/context'
	import { Button } from '$lib/ui/components'
	import { toast } from '$lib/ui/features/toasts'
	import { BottomSheet } from '$lib/ui/overlays'

	import PaymentMethodEditSheet from './PaymentMethodEditSheet.svelte'
	import PaymentMethodIcon from './PaymentMethodIcon.svelte'

	interface Props {
		open: boolean
		splitId?: string
		selectedIds?: Set<string>
		onclose?: () => void
		onchange?: (selectedIds: Set<string>) => void
		onSplitCreated?: (splitId: string) => void
	}

	let {
		open = $bindable(),
		splitId,
		selectedIds = new Set(),
		onclose,
		onchange,
		onSplitCreated
	}: Props = $props()

	const platform = getPlatform()
	const paymentMethodsService = getPaymentMethodsService()
	const splitsService = getSplitsService()

	const methods = $derived(paymentMethodsService.list.current ?? [])
	const isLoading = $derived(paymentMethodsService.list.loading)

	let localSelectedIds = $state<Set<string>>(new Set())
	let isEditSheetOpen = $state(false)
	let editingMethod = $state<PaymentMethod | null>(null)
	let isSaving = $state(false)
	let initializedSplitId = $state<string | null>(null)

	$effect(() => {
		if (open) {
			localSelectedIds = new SvelteSet(selectedIds)
			if (splitId && splitId !== initializedSplitId) {
				initializedSplitId = splitId
				paymentMethodsService.setSplitId(splitId)
			}
		}
	})

	// unified close function
	function closeSheet() {
		open = false
		onclose?.()
	}

	function isSelected(id: string): boolean {
		return localSelectedIds.has(id)
	}

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

	async function ensureSplitExists(): Promise<string | null> {
		if (splitId) return splitId

		try {
			const draftData = splitsService.draft.current
			const res = await splitsService.createOrUpdate({
				name: draftData?.split.name || '',
				icon: draftData?.split.icon || '🍔',
				currency: draftData?.split.currency || 'RUB'
			})
			const newId = res.split.id
			onSplitCreated?.(newId)
			return newId
		} catch (e) {
			console.error('Failed to create draft for payment methods', e)
			toast.error('Не удалось сохранить черновик')
			return null
		}
	}

	async function handleConfirm() {
		const hasChanges =
			selectedIds.size !== localSelectedIds.size ||
			[...selectedIds].some(id => !localSelectedIds.has(id)) ||
			[...localSelectedIds].some(id => !selectedIds.has(id))

		if (!hasChanges) {
			closeSheet()
			return
		}

		if (localSelectedIds.size === 0 && selectedIds.size === 0) {
			closeSheet()
			return
		}

		isSaving = true

		try {
			const targetSplitId = await ensureSplitExists()
			if (!targetSplitId) {
				isSaving = false
				return
			}

			if (targetSplitId !== initializedSplitId) {
				initializedSplitId = targetSplitId
				paymentMethodsService.setSplitId(targetSplitId)
			}

			const currentMethods = paymentMethodsService.splitMethods.current ?? []
			const currentIds = new Set(currentMethods.map(m => m.id))

			const toAdd = [...localSelectedIds].filter(id => !currentIds.has(id))
			const toRemove = [...currentIds].filter(id => !localSelectedIds.has(id))

			await Promise.all([
				...toAdd.map(id => paymentMethodsService.addToSplit(targetSplitId, id)),
				...toRemove.map(id => paymentMethodsService.removeFromSplit(targetSplitId, id))
			])

			onchange?.(localSelectedIds)
			closeSheet()
			platform.haptic.impact('light')
		} catch {
			toast.error('Не удалось сохранить способы оплаты')
		} finally {
			isSaving = false
		}
	}

	function handleAddNew() {
		editingMethod = null
		isEditSheetOpen = true
		platform.haptic.impact('light')
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

	const typeLabels: Record<string, string> = {
		sbp: 'СБП',
		card: 'Карта',
		phone: 'Телефон',
		bank_transfer: 'Перевод',
		cash: 'Наличные',
		crypto: 'Крипто',
		custom: 'Другое'
	}

	function getMethodDisplayInfo(method: PaymentMethod): { name: string; detail?: string } {
		const data = method.paymentData as Record<string, string> | null
		const baseName = method.displayName || typeLabels[method.type] || method.type

		switch (method.type) {
			case 'sbp':
			case 'phone':
				return { name: baseName, detail: data?.phone }
			case 'card':
				return {
					name: baseName,
					detail: data?.cardNumber?.slice(-4)
						? `•••• ${data.cardNumber.slice(-4)}`
						: undefined
				}
			case 'crypto':
				return { name: baseName, detail: data?.network }
			default:
				return { name: baseName }
		}
	}

	const selectedCount = $derived(localSelectedIds.size)
	const hasChanges = $derived(
		selectedIds.size !== localSelectedIds.size ||
			[...selectedIds].some(id => !localSelectedIds.has(id)) ||
			[...localSelectedIds].some(id => !selectedIds.has(id))
	)
</script>

<BottomSheet bind:open onclose={closeSheet} title="Способы оплаты">
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
					{@const info = getMethodDisplayInfo(method)}
					<button
						type="button"
						class="method-row"
						class:selected={isSelected(method.id)}
						onclick={() => toggleSelection(method.id)}
					>
						<PaymentMethodIcon type={method.type} size={40} />
						<div class="method-info">
							<span class="method-name">{info.name}</span>
							<span class="method-type">
								{typeLabels[method.type]}{#if info.detail}
									· {info.detail}{/if}
							</span>
						</div>
						<div class="method-check" class:checked={isSelected(method.id)}>
							{#if isSelected(method.id)}
								<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
									<path
										d="M2 7L5.5 10.5L12 4"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		{/if}

		<div class="actions">
			<Button variant="secondary" onclick={handleAddNew}>
				{#snippet iconLeft()}
					<Plus size={20} />
				{/snippet}
				Добавить
			</Button>

			<Button
				variant="primary"
				onclick={handleConfirm}
				loading={isSaving}
				class="confirm-btn"
			>
				{#if hasChanges && selectedCount > 0}
					Готово ({selectedCount})
				{:else}
					Готово
				{/if}
			</Button>
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

	.method-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background: var(--color-bg-secondary);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all 0.15s var(--ease-out);
		border: 2px solid transparent;
	}

	.method-row:active {
		transform: scale(0.98);
	}

	.method-row.selected {
		border-color: var(--color-primary);
	}

	.method-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		text-align: left;
	}

	.method-name {
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		color: var(--color-text);
	}

	.method-type {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
	}

	.method-check {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 2px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s var(--ease-out);
		flex-shrink: 0;
	}

	.method-check.checked {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: white;
	}

	.actions {
		display: flex;
		gap: var(--space-3);
		margin-top: var(--space-2);
	}

	:global(.confirm-btn) {
		flex: 1;
	}
</style>
