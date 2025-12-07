<script lang="ts">
	import {
		getAvatarColor,
		getInitials
	} from '$lib/shared/avatar' /* (импортируем наши утилиты) */

	interface Props {
		id?: string
		name: string
		url?: string
		size?: number
	}

	const { id = 'anon', name, url, size = 48 }: Props = $props()

	const initials = $derived(getInitials(name))
	const color = $derived(getAvatarColor(id))

	let hasError = $state(false)
</script>

<div class="avatar" style:width="{size}px" style:height="{size}px" style:background-color={color}>
	{#if url && !hasError}
		<img src={url} alt={name} onerror={() => (hasError = true)} loading="lazy" />
	{:else}
		<span class="initials" style:font-size="{size * 0.4}px">
			{initials}
		</span>
	{/if}
</div>

<style>
	.avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		overflow: hidden;
		user-select: none;
		flex-shrink: 0;
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.initials {
		color: #ffffff;
		font-weight: 600;
		text-transform: uppercase;
		mix-blend-mode: overlay;
	}
</style>
