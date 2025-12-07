<!-- file: services/frontend/src/routes/+layout.svelte -->
<script lang="ts">
	import '$lib/assets/styles/base.css'

	import { onMount } from 'svelte'

	import { onNavigate } from '$app/navigation'
	import { app, setPlatformContext } from '$lib/app/context.svelte'
	import { getNavigationDirection } from '$lib/navigation/routes'
	import { createPlatform } from '$lib/platform/create'
	import { createLogger } from '$lib/shared/logger'
	import AppShell from '$lib/ui/layouts/AppShell.svelte'
	import Navbar from '$lib/ui/layouts/Navbar.svelte'
	import ConsentScreen from '$lib/ui/screens/ConsentScreen.svelte'
	import ErrorScreen from '$lib/ui/screens/ErrorScreen.svelte'
	import LoadingScreen from '$lib/ui/screens/LoadingScreen.svelte'
	import LoginScreen from '$lib/ui/screens/LoginScreen.svelte'

	const { children } = $props()
	const log = createLogger('layout')

	let initialized = $state(false)

	const platform = createPlatform()
	setPlatformContext(platform)

	onMount(async () => {
		try {
			const initResult = await platform.init()

			if (!initResult.ok) {
				log.error('platform init failed', initResult.error.message)
				app.setError(initResult.error)
				initialized = true
				return
			}

			await app.init(platform)
			initialized = true
		} catch (error) {
			log.error('initialization failed', error)
			app.setError(error instanceof Error ? error : new Error('initialization failed'))
			initialized = true
		}
	})

	onNavigate(navigation => {
		if (!document.startViewTransition) return

		const from = navigation.from?.url.pathname || '/'
		const to = navigation.to?.url.pathname || '/'
		document.documentElement.dataset.navDirection = getNavigationDirection(from, to)

		return new Promise(resolve => {
			document.startViewTransition(async () => {
				resolve()
				await navigation.complete
			})
		})
	})

	function handleRetry() {
		window.location.reload()
	}
</script>

<svelte:head>
	<title>chopcheck</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
</svelte:head>

{#if !initialized}
	<LoadingScreen message="инициализация..." />
{:else if app.state.status === 'error' && app.state.error}
	<ErrorScreen error={app.state.error} onRetry={handleRetry} />
{:else if app.state.status === 'consent_required'}
	<ConsentScreen />
{:else if app.state.status === 'unauthenticated'}
	<LoginScreen />
{:else if app.state.status === 'authenticating'}
	<LoadingScreen message="авторизация..." />
{:else if app.state.status === 'ready'}
	<div id="portal-root"></div>

	<AppShell>
		{#snippet navbar()}
			<Navbar />
		{/snippet}

		{@render children?.()}
	</AppShell>
{:else}
	<LoadingScreen />
{/if}

<style>
	#portal-root {
		position: relative;
		z-index: var(--z-modal);
	}
</style>
