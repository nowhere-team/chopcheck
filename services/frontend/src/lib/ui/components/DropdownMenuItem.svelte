<script lang="ts">
	import type { Snippet } from 'svelte'

	import { getPlatform } from '$lib/app/context.svelte'

	interface Props {
		variant?: 'default' | 'danger'
		icon?: Snippet
		onclick?: () => void
		children: Snippet
	}

	const { variant = 'default', icon, onclick, children }: Props = $props()
	const platform = getPlatform()

	function handleClick() {
		platform.haptic.impact(variant === 'danger' ? 'medium' : 'light')
		onclick?.()
	}
</script>

<button type="button" class="menu-item" class:danger={variant === 'danger'} onclick={handleClick}>
	{#if icon}
		<span class="menu-icon">
			{@render icon()}
		</span>
	{/if}
	<span class="menu-label">
		{@render children()}
	</span>
</button>

<style>
	.menu-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		color: var(--color-text);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: background 0.15s var(--ease-out);
		-webkit-tap-highlight-color: transparent;
		width: 100%;
		text-align: left;
	}

	.menu-item:hover {
		background: var(--color-bg-secondary);
	}

	.menu-item:active {
		background: var(--color-bg-tertiary);
	}

	.menu-item.danger {
		color: var(--color-error);
	}

	.menu-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.menu-label {
		flex: 1;
	}
</style>
