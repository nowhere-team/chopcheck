<script lang="ts">
	import { m } from '$lib/i18n'
	import type { ItemGroup, Participant } from '$lib/services/api/types'
	import { Button } from '$lib/ui/components'
	import { PaymentMethodsSheet } from '$lib/ui/features/payments'
	import ScannerSheet from '$lib/ui/features/receipts/ScannerSheet.svelte'
	import GroupCreateSheet from '$lib/ui/features/splits/GroupCreateSheet.svelte'
	import ItemEditForm from '$lib/ui/features/splits/ItemEditForm.svelte'
	import ParticipantsSheet from '$lib/ui/features/splits/ParticipantsSheet.svelte'
	import { BottomSheet } from '$lib/ui/overlays'

	import { getSplitCreateContext } from './context.svelte'

	interface Props {
		participants: Participant[]
		itemGroups: ItemGroup[]
		splitId?: string
		selectedPaymentMethodIds: Set<string>

		onScanQr: () => void
		onUploadImage: (file: File) => void
		onSaveItem: (groupId: string | null) => void
		onDeleteItem: () => void
		onCreateGroup: (data: { name: string; icon: string }) => void
		onSaveGroup: () => void
		onPaymentMethodsChange: () => void
		onPaymentMethodsSplitCreated: (splitId: string) => void
	}

	const {
		participants,
		itemGroups,
		splitId,
		selectedPaymentMethodIds,
		onScanQr,
		onUploadImage,
		onSaveItem,
		onDeleteItem,
		onCreateGroup,
		onSaveGroup,
		onPaymentMethodsChange,
		onPaymentMethodsSplitCreated
	}: Props = $props()

	const ctx = getSplitCreateContext()

	// refs
	let itemEditFormRef = $state<{ setGroupId: (id: string) => void } | null>(null)

	// reactive sheet states bound to machine
	let participantsOpen = $state(false)
	let paymentMethodsOpen = $state(false)
	let scannerOpen = $state(false)
	let itemEditOpen = $state(false)
	let groupCreateOpen = $state(false)
	let groupEditOpen = $state(false)

	// sync sheet states with machine
	$effect(() => {
		participantsOpen = ctx.sheets.current === 'participants'
		paymentMethodsOpen = ctx.sheets.current === 'payment-methods'
		scannerOpen = ctx.sheets.current === 'scanner'
		itemEditOpen = ctx.sheets.current === 'item-edit'
		groupCreateOpen = ctx.sheets.current === 'group-create'
		groupEditOpen = ctx.sheets.current === 'group-edit'
	})

	// update machine when sheets close externally
	function handleParticipantsChange(open: boolean) {
		if (!open && ctx.sheets.current === 'participants') ctx.sheets.close()
	}

	function handlePaymentMethodsChange(open: boolean) {
		if (!open && ctx.sheets.current === 'payment-methods') ctx.sheets.close()
	}

	function handleScannerChange(open: boolean) {
		if (!open && ctx.sheets.current === 'scanner') ctx.sheets.close()
	}

	function handleItemEditChange(open: boolean) {
		if (!open && ctx.sheets.current === 'item-edit') ctx.sheets.close()
	}

	function handleGroupCreateChange(open: boolean) {
		if (!open && ctx.sheets.current === 'group-create') ctx.sheets.close()
	}

	function handleGroupEditChange(open: boolean) {
		if (!open && ctx.sheets.current === 'group-edit') ctx.sheets.close()
	}

	function closeSheet() {
		ctx.sheets.close()
	}

	function handleRequestCreateGroup() {
		ctx.sheets.open('group-create')
	}

	function handleGroupCreated(data: { name: string; icon: string }) {
		onCreateGroup(data)
	}

	function handleScanQr() {
		closeSheet()
		// small delay to let sheet close animation finish
		setTimeout(() => onScanQr(), 100)
	}

	function handleUploadImage(file: File) {
		closeSheet()
		setTimeout(() => onUploadImage(file), 100)
	}
</script>

<!-- participants -->
<ParticipantsSheet
	bind:open={participantsOpen}
	{participants}
	onclose={() => handleParticipantsChange(false)}
/>

<!-- payment methods -->
<PaymentMethodsSheet
	bind:open={paymentMethodsOpen}
	{splitId}
	selectedIds={selectedPaymentMethodIds}
	onclose={() => handlePaymentMethodsChange(false)}
	onchange={onPaymentMethodsChange}
	onSplitCreated={onPaymentMethodsSplitCreated}
/>

<!-- scanner -->
<ScannerSheet
	bind:open={scannerOpen}
	onclose={() => handleScannerChange(false)}
	onscanqr={handleScanQr}
	onuploadimage={handleUploadImage}
/>

<!-- item edit -->
<BottomSheet
	bind:open={itemEditOpen}
	title={ctx.sheets.context.isNewItem ? m.item_new_title() : m.item_edit_title()}
	onclose={() => handleItemEditChange(false)}
>
	{#if ctx.sheets.context.editingItem}
		<ItemEditForm
			bind:this={itemEditFormRef}
			bind:item={ctx.sheets.context.editingItem}
			groupId={ctx.sheets.context.editingItemGroupId}
			groups={itemGroups}
			onSave={onSaveItem}
			onDelete={onDeleteItem}
			onCancel={closeSheet}
			onRequestCreateGroup={handleRequestCreateGroup}
		/>
	{/if}
</BottomSheet>

<!-- group create -->
<GroupCreateSheet
	bind:open={groupCreateOpen}
	onclose={() => handleGroupCreateChange(false)}
	oncreate={handleGroupCreated}
/>

<!-- group edit -->
<BottomSheet
	bind:open={groupEditOpen}
	title={m.group_edit_title()}
	onclose={() => handleGroupEditChange(false)}
>
	{#if ctx.sheets.context.editingGroup}
		<div class="group-edit-form">
			<div class="form-field">
				<label for="group-name">{m.item_name_label()}</label>
				<input
					id="group-name"
					type="text"
					bind:value={ctx.sheets.context.editingGroup.name}
					placeholder={m.group_name_placeholder()}
					class="form-input"
				/>
			</div>
			<div class="form-actions">
				<Button variant="secondary" onclick={closeSheet}>
					{m.action_cancel()}
				</Button>
				<Button variant="primary" onclick={onSaveGroup}>
					{m.action_save()}
				</Button>
			</div>
		</div>
	{/if}
</BottomSheet>

<style>
	.group-edit-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.form-field label {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-text-secondary);
	}

	.form-input {
		width: 100%;
		padding: var(--space-3);
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--text-base);
		color: var(--color-text);
		box-sizing: border-box;
	}

	.form-input:focus {
		border-color: var(--color-primary);
		outline: none;
	}

	.form-actions {
		display: flex;
		gap: var(--space-2);
		justify-content: flex-end;
	}
</style>
