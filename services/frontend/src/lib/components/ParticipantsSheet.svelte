<script lang="ts">
	import type { Participant } from '$api/types'
	import ParticipantAvatar from '$components/ParticipantAvatar.svelte'
	import { m } from '$lib/i18n'

	interface Props {
		participants: Participant[]
		onKick?: (participantId: string) => void
	}

	const { participants, onKick }: Props = $props()

	function handleKick(participantId: string) {
		if (onKick) {
			onKick(participantId)
		}
	}
</script>

<div class="participants-sheet">
	{#if participants.length === 0}
		<p class="empty">{m.participants_empty()}</p>
	{:else}
		<div class="participants-list">
			{#each participants as participant (participant.id)}
				<div class="participant-item">
					<ParticipantAvatar {participant} size={48} />
					<div class="participant-info">
						<span class="participant-name">
							{participant.user?.displayName || participant.displayName || 'Участник'}
						</span>
						{#if participant.user?.username}
							<span class="participant-username">@{participant.user.username}</span>
						{/if}
					</div>
					{#if onKick}
						<button class="kick-button" type="button" onclick={() => handleKick(participant.id)}>
							{m.participants_kick_button()}
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.participants-sheet {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4-m);
		padding-top: var(--spacing-4-m);
	}

	.empty {
		color: var(--color-text-secondary);
		text-align: center;
		padding: var(--spacing-6-m) var(--spacing-4-m);
		font-size: var(--text-sm);
		line-height: 1.5;
	}

	.participants-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-3-m);
	}

	.participant-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-3-m);
		padding: var(--spacing-3-m);
		background: var(--color-bg-surface-secondary);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-default);
	}

	.participant-info {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-m);
		flex: 1;
		min-width: 0;
	}

	.participant-name {
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		color: var(--color-text-primary);
	}

	.participant-username {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
	}

	.kick-button {
		all: unset;
		padding: var(--spacing-2-m) var(--spacing-3-m);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-text-error, #ef4444);
		border: 1px solid var(--color-text-error, #ef4444);
		border-radius: var(--radius-default);
		cursor: pointer;
		transition: all 150ms;
		-webkit-tap-highlight-color: transparent;
	}

	.kick-button:active {
		transform: scale(0.95);
		background: rgba(239, 68, 68, 0.1);
	}
</style>
