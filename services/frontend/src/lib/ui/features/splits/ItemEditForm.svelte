<script lang="ts">
	import { Trash } from 'phosphor-svelte'
	import { onMount } from 'svelte'
	import { fade, fly } from 'svelte/transition'

	import { m } from '$lib/i18n'
	import type { DraftItem, ItemBboxDto, ItemGroup } from '$lib/services/api/types'
	import { receiptImagesStore } from '$lib/state/stores/receipt-images.svelte'
	import { Button, Divider, Input } from '$lib/ui/components'
	import ReceiptItemCrop from '$lib/ui/features/receipts/ReceiptItemCrop.svelte'
	import { EditableEmoji, PriceInput, Select } from '$lib/ui/forms'
	import Portal from '$lib/ui/overlays/Portal.svelte'

	interface Props {
		item: DraftItem
		groupId?: string | null
		groups?: ItemGroup[]
		receiptId?: string | null
		bbox?: ItemBboxDto | null
		onSave?: (groupId: string | null) => void
		onDelete?: () => void
		onCancel?: () => void
		onRequestCreateGroup?: () => void
	}

	let {
		item = $bindable(),
		groupId = null,
		groups = [],
		receiptId = null,
		bbox = null,
		onSave,
		onDelete,
		onCancel,
		onRequestCreateGroup
	}: Props = $props()

	// --- State ---
	let iconValue = $derived(item.icon || '📦')
	let selectedGroupId = $derived(groupId)

	// --- Image Loading State ---
	let imageUrl = $state<string | null>(null)
	let imageDims = $state<{ width: number; height: number } | null>(null)
	let rotation = $state<0 | 90 | 180 | 270>(0)
	let isImageReady = $state(false)

	// Загружаем данные картинки при маунте, если есть receiptId и bbox
	onMount(async () => {
		if (receiptId && bbox) {
			const data = await receiptImagesStore.load(receiptId)
			if (!data) return

			const savedImage = data.savedImages.find(img => img.index === bbox.index)
			const metadata = data.imageMetadata.find(meta => meta.index === bbox.index)

			if (savedImage?.url) {
				imageUrl = savedImage.url
				rotation = (metadata?.rotation as any) ?? 0

				// Preload to get dims
				const img = new Image()
				img.src = savedImage.url
				img.onload = () => {
					imageDims = { width: img.naturalWidth, height: img.naturalHeight }
					isImageReady = true
				}
			}
		}
	})

	// --- Form Logic ---

	const divisionMethods = [
		{
			value: 'by_fraction',
			label: m.division_method_shares(),
			description: m.division_method_shares_desc()
		},
		{
			value: 'per_unit',
			label: m.division_method_per_unit(),
			description: m.division_method_per_unit_desc()
		},
		{
			value: 'by_amount',
			label: m.division_method_by_amount(),
			description: m.division_method_by_amount_desc()
		},
		{
			value: 'custom',
			label: m.division_method_custom(),
			description: m.division_method_custom_desc()
		}
	]

	const groupOptions = $derived([
		{ value: '__none__', label: 'Без группы' },
		...groups.map(g => ({
			value: g.id,
			label: `${g.icon || '📦'} ${g.name}`
		})),
		{ value: '__new__', label: '+ Создать группу' }
	])

	const groupSelectValue = $derived(selectedGroupId ?? '__none__')

	function handleEmojiChange(newEmoji: string) {
		iconValue = newEmoji
		item.icon = newEmoji
	}

	function handleGroupChange(value: string) {
		if (value === '__new__') {
			onRequestCreateGroup?.()
		} else if (value === '__none__') {
			selectedGroupId = null
		} else {
			selectedGroupId = value
		}
	}

	function handleSave() {
		onSave?.(selectedGroupId)
	}

	export function setGroupId(id: string) {
		selectedGroupId = id
	}
</script>

<!-- Portal for Crop View -->
{#if isImageReady && imageUrl && bbox && imageDims}
	<Portal target="body">
		<div
			class="crop-portal-container"
			in:fly={{ y: -20, duration: 300 }}
			out:fade={{ duration: 200 }}
		>
			<ReceiptItemCrop
				{imageUrl}
				bbox={bbox.coords}
				{rotation}
				imageWidth={imageDims.width}
				imageHeight={imageDims.height}
			/>
		</div>
	</Portal>
{/if}

<form onsubmit={e => e.preventDefault()} class="edit-form">
	<!-- Spacer for visual comfort if crop is present (optional) -->
	<!-- <div class="spacer"></div> -->

	<div class="fields">
		<div class="name-row">
			<div class="icon-field">
				<EditableEmoji value={iconValue} onchange={handleEmojiChange} size={44} />
			</div>
			<div class="name-input">
				<Input bind:value={item.name} placeholder={m.item_name_placeholder()} />
			</div>
		</div>

		<Divider />

		<div class="row">
			<Input
				label={m.quantity_label()}
				type="number"
				inputmode="numeric"
				bind:value={item.quantity}
			/>
			<PriceInput label={m.item_price_label()} bind:value={item.price} />
		</div>

		<Select
			label={m.item_division_method_label()}
			options={divisionMethods}
			bind:value={item.defaultDivisionMethod}
		/>

		<Select
			label="Группа"
			options={groupOptions}
			value={groupSelectValue}
			onchange={handleGroupChange}
		/>
	</div>

	<Divider />

	<div class="actions">
		<Button variant="danger" onclick={onDelete ?? onCancel}>
			{#snippet iconLeft()}
				<Trash size={24} />
			{/snippet}
		</Button>
		<Button variant="primary" onclick={handleSave} class="save-btn">{m.action_save()}</Button>
	</div>
</form>

<style>
	.crop-portal-container {
		position: fixed;
		top: calc(var(--safe-top) + 20px);
		left: 50%;
		transform: translateX(-50%);
		width: calc(100% - 32px);
		max-width: 400px;
		height: 180px;
		z-index: 6000; /* Higher than modal backdrop, visible above sheet */
		pointer-events: auto;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
		border-radius: var(--radius-lg);
	}

	.edit-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		/* Padding bottom handled by bottom sheet container */
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.name-row {
		display: flex;
		gap: var(--space-3);
		align-items: flex-end;
	}

	.icon-field {
		padding-bottom: 2px;
	}

	.name-input {
		flex: 1;
	}

	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
	}

	.actions {
		display: flex;
		gap: var(--space-3);
		margin-top: var(--space-2);
	}

	:global(.save-btn) {
		flex: 1;
	}
</style>
