<script lang="ts">
	import { useDebounce } from 'runed'
	import { untrack } from 'svelte'

	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { getPlatform } from '$lib/app/context.svelte'
	import { m } from '$lib/i18n'
	import type { ItemGroup, Participant, SplitItem } from '$lib/services/api/types'
	import { receiptScanner } from '$lib/services/receipts/scanner.svelte'
	import {
		fileToBase64,
		streamReceiptFromImage,
		streamReceiptFromQr
	} from '$lib/services/receipts/stream'
	import { scanQrCode } from '$lib/services/scanner/qr'
	import { getPaymentMethodsService, getSplitsService } from '$lib/state/context'
	import { Button, Divider } from '$lib/ui/components'
	import { modal } from '$lib/ui/features/modals'
	import {
		CreateSheets,
		createSplitCreateContext,
		ItemsSection,
		setSplitCreateContext,
		SplitHeader,
		SplitSettings
	} from '$lib/ui/features/split-create'
	import { toast } from '$lib/ui/features/toasts'
	import Page from '$lib/ui/layouts/Page.svelte'
	import SelectionToolbar from '$lib/ui/layouts/SelectionToolbar.svelte'

	const platform = getPlatform()
	const splitsService = getSplitsService()
	const paymentMethodsService = getPaymentMethodsService()
	const scanner = receiptScanner

	const draft = $derived(splitsService.draft)
	const splitData = $derived(draft.current?.split)
	const splitId = $derived(splitData?.id)
	const participants = $derived<Participant[]>(draft.current?.participants ?? [])
	const items = $derived<SplitItem[]>(draft.current?.items ?? [])
	const itemGroups = $derived<ItemGroup[]>(draft.current?.itemGroups ?? [])

	const allPaymentMethods = $derived(paymentMethodsService.list.current ?? [])
	const splitPaymentMethods = $derived(paymentMethodsService.splitMethods.current ?? [])
	const selectedPaymentMethodIds = $derived(new Set(splitPaymentMethods.map(m => m.id)))
	const selectedPaymentMethods = $derived(
		allPaymentMethods.filter(m => selectedPaymentMethodIds.has(m.id))
	)

	const ctx = createSplitCreateContext()
	setSplitCreateContext(ctx)

	let initialized = $state(false)
	$effect(() => {
		if (splitData && !initialized) {
			ctx.initFromDraft({
				name: splitData.name ?? '',
				icon: splitData.icon ?? '🍔',
				currency: splitData.currency ?? 'RUB'
			})
			initialized = true
		}
	})

	let paymentMethodsInitialized = $state(false)
	$effect(() => {
		if (splitId && !paymentMethodsInitialized) {
			paymentMethodsService.setSplitId(splitId)
			paymentMethodsInitialized = true
		}
	})

	const selectionCount = $derived(ctx.selection.count)
	const selectionActive = $derived(ctx.selection.active)

	// validation
	const canPublish = $derived(items.length > 0 && ctx.localName.trim().length > 0)

	let isPublishing = $state(false)

	const saveMetadata = useDebounce(async () => {
		await splitsService.createOrUpdate({
			id: splitId,
			name: ctx.localName,
			icon: ctx.localIcon,
			currency: ctx.localCurrency
		})
	}, 800)

	async function handleNameChange(val: string) {
		splitsService.updateDraftLocal({ split: { name: val } })
		await saveMetadata()
	}

	async function handleIconChange(val: string) {
		splitsService.updateDraftLocal({ split: { icon: val } })
		await saveMetadata()
	}

	async function handleDeleteSelected() {
		if (ctx.selection.count === 0 || !splitId) return
		const idsToDelete = [...ctx.selection.ids].filter(id => !id.startsWith('temp-'))
		ctx.selection.clear()

		try {
			await Promise.all(idsToDelete.map(id => splitsService.deleteItem(splitId, id)))
		} catch {
			toast.error(m.error_item_delete_failed())
			await splitsService.draft.refetch()
		}
	}

	async function handleSaveItem(groupId: string | null) {
		const item = ctx.sheets.context.editingItem
		if (!item) return

		const isNew = !item.id || item.id.startsWith('temp-')
		ctx.sheets.close()

		try {
			let currentSplitId = splitId
			if (!currentSplitId) {
				const res = await splitsService.createOrUpdate({
					name: ctx.localName,
					icon: ctx.localIcon,
					currency: ctx.localCurrency
				})
				currentSplitId = res.split.id
			}

			if (isNew) {
				await splitsService.addItem(currentSplitId, { ...item, groupId })
			} else {
				await splitsService.updateItem(currentSplitId, item.id!, { ...item, groupId })
			}
		} catch {
			toast.error(m.error_saving())
			await splitsService.draft.refetch()
		}
	}

	function handleDeleteItem() {
		const item = ctx.sheets.context.editingItem
		if (!item?.id || !splitId) {
			ctx.sheets.close()
			return
		}

		const itemId = item.id
		ctx.sheets.close()

		if (!itemId.startsWith('temp-')) {
			splitsService.deleteItem(splitId, itemId).catch(() => {
				toast.error(m.error_item_delete_failed())
				splitsService.draft.refetch()
			})
		}
	}

	async function handleCreateGroup(data: { name: string; icon: string }) {
		try {
			let currentSplitId = splitId
			if (!currentSplitId) {
				const res = await splitsService.createOrUpdate({
					name: ctx.localName,
					icon: ctx.localIcon,
					currency: ctx.localCurrency
				})
				currentSplitId = res.split.id
			}

			const groupRes = await splitsService.createGroup(currentSplitId, {
				name: data.name,
				icon: data.icon,
				type: 'custom'
			})

			const newGroup = groupRes.itemGroups.find(g => g.name === data.name)
			if (newGroup) {
				ctx.sheets.setEditingItemGroupId(newGroup.id)
			}

			if (ctx.sheets.context.editingItem) {
				ctx.sheets.current = 'item-edit'
			} else {
				ctx.sheets.close()
			}

			toast.success('Группа создана')
		} catch {
			toast.error(m.error_saving())
		}
	}

	async function handleSaveGroup() {
		const group = ctx.sheets.context.editingGroup
		if (!group?.id || !splitId) return

		ctx.sheets.close()

		try {
			await splitsService.updateGroup(splitId, group.id, {
				name: group.name,
				icon: group.icon
			})
		} catch {
			toast.error(m.error_saving())
			await splitsService.draft.refetch()
		}
	}

	function handleEditGroup(group: ItemGroup) {
		ctx.sheets.openGroupEdit(group)
	}

	async function handleDeleteGroup(group: ItemGroup) {
		if (!splitId) return
		try {
			await splitsService.deleteGroup(splitId, group.id)
		} catch {
			toast.error(m.error_saving())
			await splitsService.draft.refetch()
		}
	}

	async function handleDisbandGroup(group: ItemGroup) {
		if (!splitId) return
		const groupItems = items.filter(i => i.groupId === group.id)

		try {
			for (const item of groupItems) {
				await splitsService.updateItem(splitId, item.id, { groupId: null })
			}
			await splitsService.deleteGroup(splitId, group.id)
			toast.success('Группа расформирована')
		} catch {
			toast.error(m.error_saving())
			await splitsService.draft.refetch()
		}
	}

	async function handleScanQr() {
		const result = await scanQrCode()
		if (result.success && result.data) {
			if (!scanner.start()) return
			await streamReceiptFromQr(result.data, e => scanner.handleStreamEvent(e))
		} else if (result.error) {
			toast.error(result.error)
		}
	}

	async function handleUploadImage(file: File) {
		try {
			const base64 = await fileToBase64(file)
			if (!scanner.start()) return
			await streamReceiptFromImage(base64, e => scanner.handleStreamEvent(e))
		} catch {
			toast.error(m.error_image_processing_failed())
		}
	}

	$effect(() => {
		const state = scanner.state
		const data = scanner.context.receiptData

		if (state === 'saving' && data) {
			untrack(() => handleScannerComplete(data))
		} else if (state === 'error' && scanner.context.error) {
			toast.error(scanner.context.error)
			setTimeout(() => scanner.reset(), 2000)
		}
	})

	async function handleScannerComplete(data: any) {
		try {
			let currentSplitId = splitId
			if (!currentSplitId) {
				// Determine name BEFORE API call to pass validation
				let nameToSave = ctx.localName.trim()
				if (!nameToSave) {
					if (scanner.context.storeName) {
						nameToSave = scanner.context.storeName
					} else {
						nameToSave = m.create_split_default_name() // Fallback e.g. "Новый сплит"
					}
					// Update local state immediately
					ctx.localName = nameToSave
				}

				const res = await splitsService.createOrUpdate({
					name: nameToSave,
					currency: ctx.localCurrency,
					items: []
				})
				currentSplitId = res.split.id
			}

			await splitsService.linkReceipt(currentSplitId, data.receipt.id)
			if (data.cached) {
				toast.success(m.success_receipt_already_exists())
			} else {
				toast.success(m.success_receipt_uploaded())
			}

			// If name was updated by scanner metadata
			if (
				(!ctx.localName || ctx.localName === m.create_split_default_name()) &&
				scanner.context.storeName
			) {
				ctx.localName = scanner.context.storeName
				splitsService.updateDraftLocal({ split: { name: ctx.localName } })
				await saveMetadata()
			}

			// Show warnings if any (e.g. unreadable receipt)
			if (scanner.context.warnings && scanner.context.warnings.length > 0) {
				scanner.context.warnings.forEach(w => toast.warning(w))
			}

			scanner.saved()
		} catch {
			scanner.failSave(m.error_save_data_failed())
			toast.error(m.error_saving())
			setTimeout(() => scanner.reset(), 2000)
		}
	}

	function handlePaymentMethodsChange() {}

	function handlePaymentMethodsSplitCreated(newSplitId: string) {
		paymentMethodsService.setSplitId(newSplitId)
		paymentMethodsInitialized = true
	}

	async function handlePublish() {
		if (!canPublish || isPublishing) return

		isPublishing = true
		platform.haptic.impact('medium')

		try {
			// Explicitly save first to ensure we have a valid splitId and synced metadata
			const saved = await splitsService.createOrUpdate({
				id: splitId,
				name: ctx.localName,
				icon: ctx.localIcon,
				currency: ctx.localCurrency
			})

			await splitsService.publish(saved.split.id)

			const action = await modal.success('Теперь можно пригласить друзей и разделить счёт', {
				title: 'Сплит создан!',
				icon: '🎉',
				primaryAction: { label: 'Поделиться', value: 'share' },
				secondaryAction: { label: 'Перейти к сплиту', value: 'open' }
			})

			if (action === 'share') {
				await handleShare(saved.split.id)
			}

			await goto(resolve('/splits/[id]', { id: saved.split.shortId ?? saved.split.id }))
		} catch (e) {
			console.error(e)
			toast.error('Не удалось опубликовать сплит')
		} finally {
			isPublishing = false
		}
	}

	async function handleShare(id?: string) {
		const targetId = id ?? splitId
		if (!targetId) return

		try {
			const shareUrl = await splitsService.shareMessage(targetId)

			if (platform.hasFeature('share')) {
				const sdk = await import('@telegram-apps/sdk')
				if (sdk.shareURL.isAvailable()) {
					sdk.shareURL(shareUrl, `Присоединяйся к сплиту "${ctx.localName}"!`)
				}
			} else if (navigator.share) {
				await navigator.share({
					title: ctx.localName,
					text: `Присоединяйся к сплиту "${ctx.localName}"!`,
					url: shareUrl
				})
			} else {
				await navigator.clipboard.writeText(shareUrl)
				toast.success('Ссылка скопирована')
			}
		} catch {
			toast.error('Не удалось поделиться')
		}
	}
</script>

{#if selectionActive}
	<SelectionToolbar
		count={selectionCount}
		oncancel={() => ctx.selection.clear()}
		ondelete={handleDeleteSelected}
	/>
{/if}

<Page title={m.app_title_create()} navPadding>
	<SplitHeader onNameChange={handleNameChange} onIconChange={handleIconChange} />
	<SplitSettings {participants} paymentMethods={selectedPaymentMethods} />
	<Divider width={40} spacing="lg" />
	<ItemsSection
		{items}
		{itemGroups}
		splitId={splitId ?? ''}
		onEditGroup={handleEditGroup}
		onDeleteGroup={handleDeleteGroup}
		onDisbandGroup={handleDisbandGroup}
	/>

	<div class="publish-section">
		<Button
			variant="primary"
			size="lg"
			onclick={handlePublish}
			disabled={!canPublish}
			loading={isPublishing}
			class="publish-btn"
		>
			Создать сплит
		</Button>
		{#if !canPublish && items.length === 0}
			<p class="publish-hint">Добавьте хотя бы один товар</p>
		{:else if !canPublish && !ctx.localName.trim()}
			<p class="publish-hint">Укажите название сплита</p>
		{/if}
	</div>
</Page>

<CreateSheets
	{participants}
	{itemGroups}
	{splitId}
	{selectedPaymentMethodIds}
	onScanQr={handleScanQr}
	onUploadImage={handleUploadImage}
	onSaveItem={handleSaveItem}
	onDeleteItem={handleDeleteItem}
	onCreateGroup={handleCreateGroup}
	onSaveGroup={handleSaveGroup}
	onPaymentMethodsChange={handlePaymentMethodsChange}
	onPaymentMethodsSplitCreated={handlePaymentMethodsSplitCreated}
/>

<style>
	.publish-section {
		margin-top: var(--space-6);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
	}

	:global(.publish-btn) {
		width: 100%;
	}

	.publish-hint {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
		margin: 0;
	}
</style>
