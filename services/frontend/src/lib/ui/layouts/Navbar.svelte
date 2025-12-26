<script lang="ts">
	import { Calendar, House, PlusCircle, UserCircle, Users } from 'phosphor-svelte'
	import type { Component } from 'svelte'

	import { getPlatform } from '$lib/app/context.svelte'
	import { m } from '$lib/i18n'
	import { NAV_ROUTES, type NavRoute } from '$lib/navigation/routes'

	import { tabsStore } from './tabs/store.svelte'

	const items: { path: NavRoute; icon: Component; label: string; highlight?: boolean }[] = [
		{ path: '/', icon: House, label: m.app_title_home() },
		{ path: '/history', icon: Calendar, label: m.app_title_history() },
		{
			path: '/splits/create',
			icon: PlusCircle,
			label: m.app_title_create_short()
		},
		{ path: '/contacts', icon: Users, label: m.app_title_contacts() },
		{ path: '/profile', icon: UserCircle, label: m.app_title_profile() }
	]

	const platform = getPlatform()

	function handleClick(path: NavRoute, isHighlight: boolean) {
		platform.haptic.impact(isHighlight ? 'medium' : 'light')
		tabsStore.goToRoute(path, false)
	}

	const currentIndex = $derived(tabsStore.index)
	const isActive = (path: NavRoute) => NAV_ROUTES.indexOf(path) === currentIndex
</script>

<div class="navbar-floater">
	<nav class="glass-panel" aria-label="main menu">
		{#each items as item (item.path)}
			<div class="nav-button-container">
				<button
					class="nav-item"
					class:active={isActive(item.path)}
					class:highlight={item.highlight}
					onclick={() => handleClick(item.path, !!item.highlight)}
					title={item.label}
					aria-label={item.label}
					aria-current={isActive(item.path) ? 'page' : undefined}
				>
					<!--suppress HtmlUnknownTag -->
					<item.icon size={item.highlight ? 32 : 26} weight="fill" aria-hidden="true" />
				</button>
			</div>
		{/each}
	</nav>
</div>

<style>
	.navbar-floater {
		position: fixed;
		bottom: calc(var(--safe-bottom) + 16px);
		left: 50%;
		transform: translateX(-50%);
		width: calc(100% - 32px);
		max-width: 400px;
		z-index: var(--z-navbar);
		pointer-events: none;
	}

	.glass-panel {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		pointer-events: auto;
		background: var(--glass-bg);
		backdrop-filter: blur(var(--glass-blur)) saturate(180%);
		-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
		border: 1px solid var(--glass-border);
		border-radius: 28px;
		overflow: hidden;
		isolation: isolate;
	}

	.nav-button-container {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		z-index: 1;
	}

	.nav-item {
		all: unset;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		color: var(--color-text-secondary);
		border-radius: 12px;
		transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
		cursor: pointer;
		position: relative;
		-webkit-tap-highlight-color: transparent;
	}

	.nav-item:active {
		transform: scale(0.9);
	}

	.nav-item.active {
		color: var(--color-primary);
	}

	.nav-item.active:not(.highlight) {
		background: color-mix(in srgb, var(--color-primary) 8%, transparent);
		border-radius: 16px;
	}

	.nav-item.highlight {
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		border-radius: 20px;
	}

	.nav-item.highlight.active {
		background: color-mix(in srgb, var(--color-primary) 18%, transparent);
		box-shadow:
			0 0 0 1px color-mix(in srgb, var(--color-primary) 30%, transparent),
			0 10px 25px rgba(15, 23, 42, 0.18);
	}
</style>
