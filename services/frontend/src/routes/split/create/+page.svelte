<script lang="ts">
	import { Camera, Plus, Upload } from 'phosphor-svelte'
	import { onMount } from 'svelte'

	import { goto } from '$app/navigation'
	import BottomSheet from '$components/BottomSheet.svelte'
	import Box from '$components/Box.svelte'
	import Button from '$components/Button.svelte'
	import Delimiter from '$components/Delimiter.svelte'
	import EditableText from '$components/EditableText.svelte'
	import Emoji from '$components/Emoji.svelte'
	import EmojiPicker from '$components/EmojiPicker.svelte'
	import ItemEditForm from '$components/ItemEditForm.svelte'
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

	function handleUploadPhoto() {
		isScanMenuOpen = false
		haptic.soft()
	}

	// function handleQRCode() {
	// 	isScanMenuOpen = false
	// 	haptic.soft()
	// }

	function handleTakePhoto() {
		isScanMenuOpen = false
		haptic.soft()
	}

	const toast = getToastContext()

	async function handlePublish() {
		try {
			const splitId = await draft.publish()
			await draft.clear()
			haptic.success()
			toast.success('сплит создан')
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			await goto(`/split/${splitId}`)
		} catch (error) {
			haptic.error()
			const message = error instanceof Error ? error.message : 'не удалось создать сплит'
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
			{#snippet sheet()}
				<p>участники - заглушка</p>
			{/snippet}
		</SettingItem>
	</div>

	<Delimiter />

	<div class="section">
		<h2>{m.create_split_positions_title()}</h2>

		{#if draft.split.items.length === 0}
			<p class="hint">{m.create_split_positions_hint()}</p>
		{:else}
			<div class="items-list">
				{#each draft.split.items as item, index (index)}
					<Box interactive onclick={() => openEditItem(index)}>
						<div class="item-row">
							<div class="item-info">
								<span class="item-name">{item.name}</span>
								<span class="item-meta">
									{item.quantity}
									{m.quantity_unit()} · {item.price.toLocaleString('ru-RU')} ₽
								</span>
							</div>
							<div class="item-price">
								{item.price.toLocaleString('ru-RU')} ₽
							</div>
						</div>
					</Box>
				{/each}
			</div>
		{/if}

		<div class="actions-row">
			<Button variant="secondary" onclick={openScanMenu}>
				{#snippet iconLeft()}
					<Camera size={20} weight="bold" />
				{/snippet}
				{m.create_split_scan_button()}
			</Button>

			<Button variant="secondary" onclick={openAddItem}>
				{#snippet iconLeft()}
					<Plus size={20} weight="bold" />
				{/snippet}
				{m.create_split_add_item_button()}
			</Button>
		</div>
	</div>

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

<BottomSheet height={40} onclose={() => (isScanMenuOpen = false)} bind:open={isScanMenuOpen}>
	<div class="scan-menu">
		<Button variant="secondary" size="lg" onclick={handleTakePhoto}>
			{#snippet iconLeft()}
				<Camera size={24} />
			{/snippet}
			{m.create_split_scan_qr_button()}
		</Button>
		<Button variant="secondary" size="lg" onclick={handleUploadPhoto}>
			{#snippet iconLeft()}
				<Upload size={24} />
			{/snippet}
			{m.create_split_scan_upload_button()}
		</Button>
	</div>
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

	.section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4-m);
	}

	.hint {
		color: var(--color-text-tertiary);
		text-align: center;
		padding: var(--spacing-4-m);
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2-m);
	}

	.item-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-3-m);
	}

	.item-info {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-m);
		flex: 1;
		min-width: 0;
	}

	.item-name {
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		color: var(--color-text-primary);
	}

	.item-meta {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
	}

	.item-price {
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		color: var(--color-text-primary);
		flex-shrink: 0;
	}

	.actions-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-3-m);
	}

	.publish-section {
		display: flex;
		justify-content: center;
		align-items: center;
		padding-bottom: var(--spacing-6-m);
	}

	.scan-menu {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-3-m);
		padding-top: var(--spacing-6-m);
	}
</style>
