<script lang="ts">
	import type { Participant } from '$api/types'
	import { getAvatarColor, getInitials } from '$lib/utils/avatar'

	interface Props {
		participant: Participant
		size?: number
	}

	const { participant, size = 40 }: Props = $props()

	const displayName = $derived(participant.user?.displayName || participant.displayName || 'U')
	const userId = $derived(participant.user?.id || participant.userId || 'default')
	const avatarUrl = $derived(participant.user?.avatarUrl)

	const color = $derived(getAvatarColor(userId))
	const initials = $derived(getInitials(displayName))

	let imageError = $state(false)

	function handleImageError() {
		imageError = true
	}
</script>

<div class="avatar" style="width: {size}px; height: {size}px;">
	{#if avatarUrl && !imageError}
		<img src={avatarUrl} alt={displayName} onerror={handleImageError} />
	{:else}
		<div class="avatar-placeholder" style="background-color: {color};">
			<span class="initials" style="font-size: {size * 0.4}px;">{initials}</span>
		</div>
	{/if}
</div>

<style>
	.avatar {
		position: relative;
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;
	}

	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.initials {
		color: white;
		font-weight: var(--font-semibold);
		line-height: 1;
		user-select: none;
	}
</style>
