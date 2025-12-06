<script lang="ts">
	import { onMount } from 'svelte'

	import { app, setPlatformContext } from '$lib/app/context.svelte'
	import { createPlatform } from '$lib/platform/create'
	import { createLogger } from '$lib/shared/logger'
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
	{@render children?.()}
{:else}
	<LoadingScreen />
{/if}

<style>
	:global(:root) {
		--color-bg: #ffffff;
		--color-text: #0f172a;
		--color-hint: #64748b;
		--color-link: #3b82f6;
		--color-button: #0f172a;
		--color-buttonText: #ffffff;
		--color-secondaryBg: #f1f5f9;
		--safe-area-top: 0px;
		--safe-area-bottom: 0px;
		--safe-area-left: 0px;
		--safe-area-right: 0px;
	}

	:global([data-theme='dark']) {
		--color-bg: #1a1a1a;
		--color-text: #ffffff;
		--color-hint: #8b8b8b;
		--color-button: #ffffff;
		--color-buttonText: #1a1a1a;
		--color-secondaryBg: #2a2a2a;
	}

	:global(html, body) {
		margin: 0;
		padding: 0;
		height: 100%;
	}

	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: var(--color-bg);
		color: var(--color-text);
		min-height: 100vh;
		min-height: 100dvh;
		padding-top: var(--safe-area-top);
		padding-bottom: var(--safe-area-bottom);
		padding-left: var(--safe-area-left);
		padding-right: var(--safe-area-right);
	}

	:global(*) {
		box-sizing: border-box;
	}
</style>
