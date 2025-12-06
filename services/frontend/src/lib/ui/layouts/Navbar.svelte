<script lang="ts">
	import { Calendar, House, PlusCircle, UserCircle, Users } from 'phosphor-svelte'
	import type { Component } from 'svelte'

	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import type { RouteId } from '$app/types'
	import { getPlatform } from '$lib/app/context.svelte'

	interface NavItem {
		path: RouteId
		icon: Component
		label: string
	}

	const items: NavItem[] = [
		{ path: '/', icon: House, label: 'главная' },
		{ path: '/history', icon: Calendar, label: 'история' },
		{ path: '/splits/create', icon: PlusCircle, label: 'создать' },
		{ path: '/contacts', icon: Users, label: 'контакты' },
		{ path: '/profile', icon: UserCircle, label: 'профиль' }
	]

	const platform = getPlatform()

	function handleClick(path: string) {
		const isCreate = path === '/splits/create'
		platform.haptic.impact(isCreate ? 'medium' : 'light')
	}

	const isActive = (path: string) => {
		if (path === '/') return page.url.pathname === '/'
		return page.url.pathname.startsWith(path)
	}
</script>

<div class="navbar-content">
	{#each items as item (item.path)}
		<a
			href={resolve(item.path)}
			class="nav-item"
			class:active={isActive(item.path)}
			aria-label={item.label}
			onclick={() => handleClick(item.path)}
		>
			<svelte:component this={item.icon} size={28} weight="fill" />
		</a>
	{/each}
</div>

<style>
	.navbar-content {
		display: flex;
		justify-content: space-around;
		align-items: center;
		height: 64px;
		max-width: 500px;
		margin: 0 auto;
	}

	.nav-item {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		color: var(--color-icon-muted);
		border-radius: var(--radius-md);
		transition: color var(--duration-fast) var(--ease-out);
		-webkit-tap-highlight-color: transparent;
	}

	.nav-item:active {
		transform: scale(0.92);
	}

	.nav-item.active {
		color: var(--color-primary);
	}

	@media (hover: hover) {
		.nav-item:hover:not(.active) {
			color: var(--color-icon);
		}
	}
</style>
