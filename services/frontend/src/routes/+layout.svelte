<script lang="ts">
	import '$lib/assets/styles/base.css'

	import { onMount } from 'svelte'

	import { page } from '$app/state'
	import { app, setPlatformContext } from '$lib/app/context.svelte'
	import { m } from '$lib/i18n'
	import { isNavRoute } from '$lib/navigation/routes'
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
	import { TabsCarousel, TabSlide } from '$lib/ui/layouts/tabs'
	import { ContactsPage, CreatePage, HistoryPage, HomePage, ProfilePage } from '$lib/ui/pages'
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

	// check if current path is a main tab
	const isMainTab = $derived(isNavRoute(page.url.pathname))

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

		{#if isMainTab}
			<TabsCarousel>
				<TabSlide><HomePage /></TabSlide>
				<TabSlide><HistoryPage /></TabSlide>
				<TabSlide><CreatePage /></TabSlide>
				<TabSlide><ContactsPage /></TabSlide>
				<TabSlide><ProfilePage /></TabSlide>
			</TabsCarousel>
		{:else}
			{@render children?.()}
		{/if}
	</AppShell>
{:else}
	<LoadingScreen />
{/if}
