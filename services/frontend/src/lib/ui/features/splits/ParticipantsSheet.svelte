<script lang="ts">
	import { Plus, UserCirclePlus } from 'phosphor-svelte'

	import { getPlatform } from '$lib/app/context.svelte'
	import type { Participant } from '$lib/services/api/types'
	import { Avatar, Button } from '$lib/ui/components'
	import { BottomSheet } from '$lib/ui/overlays'

	interface Props {
		open: boolean
		participants: Participant[]
		onclose?: () => void
		oninvite?: () => void
	}

	let { open = $bindable(), participants, onclose, oninvite }: Props = $props()
	const platform = getPlatform()

	function handleInvite() {
		platform.haptic.impact('light')
		oninvite?.()
	}
</script>

<BottomSheet bind:open {onclose} title="Участники">
	<div class="participants-content">
		{#if participants.length === 0}
			<div class="empty">
				<UserCirclePlus size={48} weight="duotone" />
				<h2>Пока никого нет</h2>
				<span>Пригласите друзей после публикации сплита</span>
			</div>
		{:else}
			<div class="list">
				{#each participants as p (p.id)}
					<div class="participant-row">
						<Avatar
							id={p.userId ?? p.id}
							name={p.displayName ?? p.user?.displayName ?? 'Аноним'}
							url={p.user?.avatarUrl}
							size={44}
						/>
						<div class="info">
							<span class="name">
								{p.displayName ?? p.user?.displayName ?? 'Аноним'}
							</span>
							{#if p.user?.username}
								<span class="username">@{p.user.username}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<Button variant="secondary" size="lg" onclick={handleInvite}>
			{#snippet iconLeft()}
				<Plus size={20} />
			{/snippet}
			Пригласить участника
		</Button>
	</div>
</BottomSheet>

<style>
	.participants-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding-bottom: var(--space-4);
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-6) var(--space-4);
		color: var(--color-text-tertiary);
		text-align: center;
	}

	.empty h2 {
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		color: var(--color-text-secondary);
		margin: 0;
	}

	.empty span {
		font-size: var(--text-sm);
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.participant-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2) 0;
	}

	.info {
		display: flex;
		flex-direction: column;
	}

	.name {
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		color: var(--color-text);
	}

	.username {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
	}
</style>
