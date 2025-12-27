<script lang="ts">
	import { getAvatarColor, getInitials } from '$lib/shared/avatar'

	import Emoji from './Emoji.svelte'

	interface Props {
		id?: string
		name: string
		url?: string
		icon?: string
		size?: number
		glass?: boolean
		variant?: 'circle' | 'plain'
	}

	const {
		id = 'anon',
		name,
		url,
		icon,
		size = 48,
		glass = true,
		variant = 'circle'
	}: Props = $props()

	const initials = $derived(getInitials(name))
	const color = $derived(getAvatarColor(id))

	let hasError = $state(false)

	const isPlain = $derived(variant === 'plain' && icon && !url)
</script>

{#if isPlain}
	<div class="plain-emoji" style:width="{size}px" style:height="{size}px">
		<Emoji emoji={icon} size={size * 0.95} lazy />
	</div>
{:else}
	<div
		class="avatar"
		class:glass
		style:width="{size}px"
		style:height="{size}px"
		style:--avatar-color={color}
	>
		{#if url && !hasError}
			<img src={url} alt={name} onerror={() => (hasError = true)} loading="lazy" />
		{:else if icon}
			<Emoji emoji={icon} size={size * 0.6} />
		{:else}
			<span class="initials" class:glass style:font-size="{size * 0.4}px">
				{initials}
			</span>
		{/if}
	</div>
{/if}

<style>
	.avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		overflow: hidden;
		user-select: none;
		flex-shrink: 0;
		background-color: var(--avatar-color);
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
	}

	.avatar.glass {
		background: color-mix(in srgb, var(--avatar-color) 20%, var(--glass-bg));
		backdrop-filter: blur(var(--glass-blur)) saturate(180%);
		-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
		border: 1px solid var(--glass-border);
	}

	.plain-emoji {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
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

	.initials.glass {
		mix-blend-mode: normal;
		color: color-mix(in srgb, var(--avatar-color) 70%, black);
	}
</style>
