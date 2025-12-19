<script lang="ts">
	import { m } from '$lib/i18n'
	import { Button, Input } from '$lib/ui/components'
	import { EditableEmoji } from '$lib/ui/forms'
	import { BottomSheet } from '$lib/ui/overlays'

	interface Props {
		open: boolean
		onclose?: () => void
		oncreate?: (data: { name: string; icon: string }) => void
	}

	let { open = $bindable(), onclose, oncreate }: Props = $props()

	let name = $state('')
	let icon = $state('📦')
	let isCreating = $state(false)

	$effect(() => {
		if (open) {
			name = ''
			icon = '📦'
			isCreating = false
		}
	})

	function handleCreate() {
		if (!name.trim()) return
		isCreating = true
		oncreate?.({ name: name.trim(), icon })
	}

	function handleClose() {
		open = false
		onclose?.()
	}

	const canCreate = $derived(name.trim().length > 0)
</script>

<BottomSheet bind:open onclose={handleClose} title={m.group_new_title()}>
	<div class="create-form">
		<div class="form-row">
			<div class="icon-field">
				<EditableEmoji bind:value={icon} size={48} />
			</div>
			<div class="name-field">
				<Input bind:value={name} placeholder={m.group_name_placeholder()} autofocus />
			</div>
		</div>

		<div class="actions">
			<Button variant="secondary" onclick={handleClose} disabled={isCreating}>
				{m.action_cancel()}
			</Button>
			<Button
				variant="primary"
				onclick={handleCreate}
				disabled={!canCreate}
				loading={isCreating}
				class="create-btn"
			>
				{m.action_save()}
			</Button>
		</div>
	</div>
</BottomSheet>

<style>
	.create-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding-bottom: var(--space-4);
	}

	.form-row {
		display: flex;
		gap: var(--space-3);
		align-items: flex-end;
	}

	.icon-field {
		flex-shrink: 0;
	}

	.name-field {
		flex: 1;
	}

	.actions {
		display: flex;
		gap: var(--space-3);
	}

	:global(.create-btn) {
		flex: 1;
	}
</style>
