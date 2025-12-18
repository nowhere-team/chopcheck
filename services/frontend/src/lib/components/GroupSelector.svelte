<script lang="ts">
	import { Check, Plus } from 'phosphor-svelte'

	import type { ItemGroup } from '$api/types'
	import Box from '$components/Box.svelte'
	import Button from '$components/Button.svelte'
	import { m } from '$lib/i18n'

	interface Props {
		groups: ItemGroup[]
		selectedGroupId: string | null
		suggestedGroupId?: string | null
		onSelect: (groupId: string | null) => void
		onCreate: (name: string) => void
		onConfirm: () => void
		onCancel: () => void
	}

	const {
		groups,
		selectedGroupId,
		suggestedGroupId = null,
		onSelect,
		onCreate,
		onConfirm,
		onCancel
	}: Props = $props()

	let isCreating = $state(false)
	let newGroupName = $state('')

	function handleCreateGroup() {
		if (newGroupName.trim()) {
			onCreate(newGroupName.trim())
			newGroupName = ''
			isCreating = false
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleCreateGroup()
		}
	}

	const sortedGroups = $derived(() => {
		// Put suggested group first if it exists
		if (suggestedGroupId) {
			const suggested = groups.find(g => g.id === suggestedGroupId)
			const others = groups.filter(g => g.id !== suggestedGroupId)
			return suggested ? [suggested, ...others] : groups
		}
		return groups
	})
</script>

<div class="group-selector">
	<div class="header">
		<h2 class="title">{m.item_group_select()}</h2>
	</div>

	<div class="content">
		<div class="groups-list">
			<!-- No group option -->
			<Box
				interactive
				variant={selectedGroupId === null ? 'active' : 'default'}
				onclick={() => onSelect(null)}
			>
				<div class="group-item">
					<span class="group-name">{m.item_group_none()}</span>
					{#if selectedGroupId === null}
						<div class="check-icon">
							<Check weight="bold" size={20} />
						</div>
					{/if}
				</div>
			</Box>

			<!-- Existing groups -->
			{#each sortedGroups() as group (group.id)}
				<Box
					interactive
					variant={selectedGroupId === group.id ? 'active' : 'default'}
					onclick={() => onSelect(group.id)}
				>
					<div class="group-item">
						<div class="group-info">
							<span class="group-name">{group.name}</span>
							{#if group.id === suggestedGroupId}
								<span class="suggested-badge">{m.item_group_suggested()}</span>
							{/if}
						</div>
						{#if selectedGroupId === group.id}
							<div class="check-icon">
								<Check weight="bold" size={20} />
							</div>
						{/if}
					</div>
				</Box>
			{/each}

			<!-- Create new group -->
			{#if isCreating}
				<Box variant="secondary">
					<div class="create-form">
						<input
							type="text"
							class="group-input"
							placeholder={m.item_group_name_placeholder()}
							bind:value={newGroupName}
							onkeypress={handleKeyPress}
						/>
						<div class="create-actions">
							<Button
								variant="secondary"
								size="sm"
								onclick={() => {
									isCreating = false
									newGroupName = ''
								}}
							>
								{m.action_cancel()}
							</Button>
							<Button
								variant="primary"
								size="sm"
								disabled={!newGroupName.trim()}
								onclick={handleCreateGroup}
							>
								{m.action_create()}
							</Button>
						</div>
					</div>
				</Box>
			{:else}
				<Box interactive variant="secondary" onclick={() => (isCreating = true)}>
					<div class="group-item create-trigger">
						<Plus size={20} />
						<span>{m.item_group_create_new()}</span>
					</div>
				</Box>
			{/if}
		</div>
	</div>

	<div class="actions">
		<Button variant="secondary" onclick={onCancel}>
			{m.action_cancel()}
		</Button>
		<Button variant="primary" onclick={onConfirm}>
			{m.action_select()}
		</Button>
	</div>
</div>

<style>
	.group-selector {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4-m);
		padding: var(--spacing-4-m);
		background: var(--color-bg-page);
		border-radius: var(--radius-default) var(--radius-default) 0 0;
		max-height: 80vh;
	}

	.header {
		text-align: center;
	}

	.title {
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		color: var(--color-text-primary);
		margin: 0;
	}

	.content {
		flex: 1;
		overflow-y: auto;
	}

	.groups-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2-m);
	}

	.group-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-3-m);
	}

	.group-info {
		display: flex;
		align-items: center;
		gap: var(--spacing-2-m);
	}

	.group-name {
		font-weight: var(--font-medium);
		color: var(--color-text-primary);
	}

	.suggested-badge {
		font-size: var(--text-xs);
		color: var(--color-button-primary-bg);
		background: var(--color-bg-surface-secondary);
		padding: 2px 6px;
		border-radius: 4px;
	}

	.check-icon {
		color: var(--color-button-primary-bg);
		flex-shrink: 0;
	}

	.create-trigger {
		color: var(--color-text-secondary);
		gap: var(--spacing-2-m);
	}

	.create-form {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-3-m);
	}

	.group-input {
		width: 100%;
		padding: var(--spacing-3-m);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-default);
		font-size: var(--text-base);
		background: var(--color-bg-surface);
		color: var(--color-text-primary);
	}

	.group-input:focus {
		outline: none;
		border-color: var(--color-button-primary-bg);
	}

	.create-actions {
		display: flex;
		gap: var(--spacing-2-m);
		justify-content: flex-end;
	}

	.actions {
		display: flex;
		gap: var(--spacing-3-m);
		padding-top: var(--spacing-2-m);
		border-top: 1px solid var(--color-border-default);
	}

	.actions :global(button) {
		flex: 1;
	}
</style>
