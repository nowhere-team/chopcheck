<script lang="ts">
	import { Calendar, House, PlusCircle, UserCircle, Users } from 'phosphor-svelte'
	import type { Component } from 'svelte'

	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import type { RouteId } from '$app/types'
	import { haptic } from '$telegram/haptic'

	type Link = {
		path: RouteId
		icon: Component
		label: string
	}

	const links: Link[] = [
		{ path: '/', icon: House, label: 'Главная' },
		{ path: '/history', icon: Calendar, label: 'История' },
		{ path: '/split/create', icon: PlusCircle, label: 'Создать' },
		{ path: '/contacts', icon: Users, label: 'Контакты' },
		{ path: '/profile', icon: UserCircle, label: 'Профиль' }
	]

	const isActive = (path: string) => page.url.pathname === path

	function handleClick(href: string) {
		if (href === '/create') {
			haptic.medium()
		} else {
			haptic.soft()
		}
	}
</script>

<nav class="navbar">
	<div class="navbar-content">
		{#each links as link (link.path)}
			<a
				href={resolve(link.path)}
				class="nav-link"
				class:active={isActive(link.path)}
				aria-label={link.label}
				onclick={() => handleClick(link.path)}
			>
				<svelte:component this={link.icon} size={32} weight="fill" />
			</a>
		{/each}
	</div>
</nav>

<style>
	.navbar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--color-bg-surface);
		border-top: 1px solid var(--color-border-default);
		z-index: 1000;
		padding-bottom: max(var(--tg-inset-bottom), 8px);
		view-transition-name: navbar;
	}

	.navbar-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 64px;
		padding: 0 var(--spacing-4-m);
		max-width: 100%;
	}

	.nav-link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		color: var(--color-icon-inactive);
		transition: color 100ms cubic-bezier(0.4, 0, 0.2, 1);
		border-radius: var(--radius-default);
		-webkit-tap-highlight-color: transparent;
		will-change: transform;
	}

	.nav-link:active {
		transform: scale(0.96);
	}

	.nav-link.active {
		color: var(--color-button-primary-bg);
	}

	@media (hover: hover) and (pointer: fine) {
		.nav-link:hover {
			background: var(--color-bg-surface-secondary);
			transition: background 150ms cubic-bezier(0.4, 0, 0.2, 1);
		}
	}
</style>
