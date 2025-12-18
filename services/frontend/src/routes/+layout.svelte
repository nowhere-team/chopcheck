<script lang="ts">
	import '$lib/assets/styles/base.css'

	import { onMount } from 'svelte'

	import { onNavigate } from '$app/navigation'
	import { app, setPlatformContext } from '$lib/app/context.svelte'
	import { m } from '$lib/i18n'
	import { getNavigationDirection } from '$lib/navigation/routes'
	import { createPlatform } from '$lib/platform/create'
	import {
		setContactsService,
		setPaymentMethodsService,
		setSplitsService,
		setUserService
	} from '$lib/state/context'
	import { ContactsService } from '$lib/state/stores/contacts.svelte'
	import { PaymentMethodsService } from '$lib/state/stores/payment-methods.svelte'
	import { SplitsService } from '$lib/state/stores/splits.svelte'
	import { UserService } from '$lib/state/stores/user.svelte'
	import AppShell from '$lib/ui/layouts/AppShell.svelte'
	import Navbar from '$lib/ui/layouts/Navbar.svelte'
	import ConsentScreen from '$lib/ui/screens/ConsentScreen.svelte'
	import ErrorScreen from '$lib/ui/screens/ErrorScreen.svelte'
	import LoadingScreen from '$lib/ui/screens/LoadingScreen.svelte'
	import LoginScreen from '$lib/ui/screens/LoginScreen.svelte'

	const { children } = $props()

	let initialized = $state(false)
	const platform = createPlatform()
	setPlatformContext(platform)

	const userService = new UserService()
	const splitsService = new SplitsService()
	const contactsService = new ContactsService()
	const paymentMethodsService = new PaymentMethodsService()

	setUserService(userService)
	setSplitsService(splitsService)
	setContactsService(contactsService)
	setPaymentMethodsService(paymentMethodsService)

	onMount(async () => {
		try {
			const initResult = await platform.init()
			if (!initResult.ok) {
				app.setError(initResult.error)
				initialized = true
				return
			}
			await app.init(platform)

			if (app.state.status === 'ready') {
				await userService.me.refetch()
			}

			initialized = true
		} catch (error) {
			app.setError(error instanceof Error ? error : new Error('initialization failed'))
			initialized = true
		}
	})

	onNavigate(navigation => {
		if (!document.startViewTransition) return
		if (navigation.type === 'popstate' || navigation.delta === -1) return

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
</script>

<svelte:head>
	<title>ChopCheck</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
</svelte:head>

{#if !initialized}
	<LoadingScreen message={m.status_initializing()} />
{:else if app.state.status === 'error' && app.state.error}
	<ErrorScreen error={app.state.error} onRetry={() => window.location.reload()} />
{:else if app.state.status === 'consent_required'}
	<ConsentScreen />
{:else if app.state.status === 'unauthenticated'}
	<LoginScreen />
{:else if app.state.status === 'authenticating'}
	<LoadingScreen message={m.status_authenticating()} />
{:else if app.state.status === 'ready'}
	<AppShell>
		{#snippet navbar()}
			<Navbar />
		{/snippet}
		{@render children?.()}
	</AppShell>
{:else}
	<LoadingScreen />
{/if}
