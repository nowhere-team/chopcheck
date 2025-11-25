<script lang="ts">
	import { Plus } from 'phosphor-svelte'

	import type { Participant } from '$api/types'
	import ParticipantAvatar from '$components/ParticipantAvatar.svelte'

	interface Props {
		participants: Participant[]
		maxVisible?: number
	}

	const { participants, maxVisible = 5 }: Props = $props()

	const visibleParticipants = $derived(participants.slice(0, maxVisible))
	const remaining = $derived(Math.max(0, participants.length - maxVisible))
</script>

<div class="participants-compact">
	{#each visibleParticipants as participant (participant.id)}
		<div class="avatar-wrapper">
			<ParticipantAvatar {participant} size={40} />
		</div>
	{/each}

	{#if remaining > 0}
		<div class="avatar-wrapper">
			<div class="more-badge">
				<Plus size={20} weight="bold" />
				<span>{remaining}</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.participants-compact {
		display: flex;
		align-items: center;
	}

	.avatar-wrapper {
		position: relative;
		margin-left: -8px;
	}

	.avatar-wrapper:first-child {
		margin-left: 0;
	}

	.avatar-wrapper :global(.avatar) {
		border: 2px solid var(--color-bg-surface);
	}

	.more-badge {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--color-bg-surface-secondary);
		border: 2px solid var(--color-bg-surface);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2px;
		color: var(--color-text-secondary);
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
	}
</style>
