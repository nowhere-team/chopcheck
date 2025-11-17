<script lang="ts">
	import { qrScanner } from '@telegram-apps/sdk'
	import { onMount } from 'svelte'

	import { goto } from '$app/navigation'
	import BottomSheet from '$components/BottomSheet.svelte'
	import Button from '$components/Button.svelte'
	import Delimiter from '$components/Delimiter.svelte'
	import EditableText from '$components/EditableText.svelte'
	import Emoji from '$components/Emoji.svelte'
	import EmojiPicker from '$components/EmojiPicker.svelte'
	import ItemEditForm from '$components/ItemEditForm.svelte'
	import ItemsList from '$components/ItemsList.svelte'
	import ParticipantsCompact from '$components/ParticipantsCompact.svelte'
	import ParticipantsSheet from '$components/ParticipantsSheet.svelte'
	import ScanMenu from '$components/ScanMenu.svelte'
	import SettingItem from '$components/SettingItem.svelte'
	import { getDraftContext, setDraftContext } from '$lib/contexts/draft.svelte'
	import { getToastContext } from '$lib/contexts/toast.svelte'
	import { m } from '$lib/i18n'
	import type { DraftItem } from '$lib/types/draft'
	import { haptic } from '$telegram/haptic'

	setDraftContext()
	const draft = getDraftContext()

	let isFormOpen = $state(false)
	let isScanMenuOpen = $state(false)
	let editingIndex = $state<number | null>(null)
	let formItem = $state<DraftItem>({
		name: '',
		price: 0,
		quantity: '1',
		type: 'product',
		defaultDivisionMethod: 'equal'
	})

	onMount(() => {
		draft.load()
	})

	function handleSelectEmoji(emoji: string) {
		draft.updateIcon(emoji)
	}

	function openAddItem() {
		editingIndex = null
		formItem = {
			name: '',
			price: 0,
			quantity: '1',
			type: 'product',
			defaultDivisionMethod: 'equal'
		}
		isFormOpen = true
		haptic.soft()
	}

	function openEditItem(index: number) {
		editingIndex = index
		const item = draft.split.items[index]!
		formItem = { ...item }
		isFormOpen = true
		haptic.soft()
	}

	function handleSaveItem() {
		if (editingIndex !== null) {
			draft.updateItem(editingIndex, formItem)
		} else {
			draft.addItem(formItem)
		}
		isFormOpen = false
		haptic.medium()
	}

	function handleDeleteItem() {
		if (editingIndex !== null) {
			draft.removeItem(editingIndex)
			isFormOpen = false
			haptic.medium()
		}
	}

	function handleCancelEdit() {
		isFormOpen = false
		haptic.soft()
	}

	function openScanMenu() {
		isScanMenuOpen = true
		haptic.soft()
	}

	async function handleScanQR() {
		isScanMenuOpen = false
		haptic.soft()

		try {
			if (!qrScanner.open.isAvailable()) {
				toast.error('QR сканер недоступен в этой версии Telegram')
				return
			}

			const qrData = await qrScanner.open({ text: 'Отсканируйте QR-код чека' })

			if (qrData) {
				toast.info(m.success_qr_scanned({ data: qrData }))
			}
		} catch (error) {
			console.error('QR scan error:', error)
			toast.error('Не удалось отсканировать QR код')
		}
	}

	function handleTakePhoto() {
		isScanMenuOpen = false
		haptic.soft()
		toast.info('Функция фото чека будет доступна скоро')
	}

	function handleUploadPhoto() {
		isScanMenuOpen = false
		haptic.soft()
		toast.info('Функция загрузки фото будет доступна скоро')
	}

	const toast = getToastContext()

	async function handlePublish() {
		try {
			const splitId = await draft.publish()
			await draft.clear()
			haptic.success()
			toast.success(m.success_split_created())
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			await goto(`/split/${splitId}`)
		} catch (error) {
			haptic.error()
			const message = error instanceof Error ? error.message : m.error_split_create_failed()
			toast.error(message)
		}
	}

	const canPublish = $derived(draft.split.name?.trim().length > 0 && draft.split.items.length > 0)
</script>

<div class="page">
	<div class="header">
		<h1 class="title">{m.app_title_create()}</h1>
		<div class="header-name">
			<EditableText
				value={draft.split.name}
				onchange={draft.updateName}
				placeholder={m.create_split_name_placeholder()}
			/>
		</div>
	</div>

	<div class="settings">
		<SettingItem label={m.create_split_icon_label()} sheetTitle={m.emoji_picker_label()}>
			{#snippet value()}
				<Emoji emoji={draft.split.icon} size={24} />
			{/snippet}

			{#snippet sheet()}
				<EmojiPicker selected={draft.split.icon} onselect={handleSelectEmoji} />
			{/snippet}
		</SettingItem>

		<SettingItem
			label={m.create_split_participants_label()}
			sheetTitle={m.split_participants_label()}
		>
			{#snippet value()}
				<ParticipantsCompact participants={[]} />
			{/snippet}

			{#snippet sheet()}
				<ParticipantsSheet participants={[]} />
			{/snippet}
		</SettingItem>
	</div>

	<Delimiter />

	<ItemsList
		items={draft.split.items}
		currency={draft.split.currency}
		onAddItem={openAddItem}
		onEditItem={openEditItem}
		onOpenScanMenu={openScanMenu}
	/>

	<Delimiter />

	<div class="publish-section">
		<Button variant="primary" size="lg" onclick={handlePublish} disabled={!canPublish}>
			{m.create_split_button()}
		</Button>
	</div>
</div>

<BottomSheet height={80} onclose={handleCancelEdit} bind:open={isFormOpen}>
	<ItemEditForm
		bind:item={formItem}
		onSave={handleSaveItem}
		onDelete={editingIndex !== null ? handleDeleteItem : undefined}
		onCancel={handleCancelEdit}
	/>
</BottomSheet>

<BottomSheet height={60} onclose={() => (isScanMenuOpen = false)} bind:open={isScanMenuOpen}>
	<ScanMenu
		onScanQR={handleScanQR}
		onTakePhoto={handleTakePhoto}
		onUploadPhoto={handleUploadPhoto}
	/>
</BottomSheet>

<style>
	.header {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2-m);
	}

	.header-name {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-3-m);
		color: var(--color-text-primary);
	}

	.settings {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2-m);
	}

	.publish-section {
		display: flex;
		justify-content: center;
		align-items: center;
		padding-bottom: var(--spacing-6-m);
	}

	.publish-section :global(button) {
		width: 100%;
	}
</style>
