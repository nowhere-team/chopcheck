<script lang="ts">
	import { isTMA } from '@telegram-apps/bridge'
	import { onMount } from 'svelte'

	import { authenticateWithTelegram, getMe } from '$api/auth'
	import { clearToken, getToken } from '$api/tokens'
	import Spinner from '$components/Spinner.svelte'
	import { setAuthContext } from '$lib/contexts/auth.svelte'
	import { setTelegramContext } from '$lib/contexts/telegram.svelte'
	import { m } from '$lib/i18n'
	import { init } from '$telegram'

	const { children } = $props()

	let initState = $state<'loading' | 'success' | 'error' | 'not-telegram'>('loading')
	let errorMessage = $state('')

	const auth = setAuthContext()
	const telegram = setTelegramContext()

	onMount(async () => {
		try {
			const tma = await isTMA('complete')
			if (!tma) {
				initState = 'not-telegram'
				return
			}

			const tg = await init()
			telegram.data = tg

			const existingToken = await getToken()
			if (existingToken) {
				if (await tryRestoreSession()) {
					finishAuth()
					return
				}
			}

			const authResponse = await authenticateWithTelegram(tg.raw!)
			auth.user = { ...authResponse.user, telegramId: tg.auth.user.id }
			finishAuth()
		} catch (err) {
			failAuth(err)
		}
	})

	async function tryRestoreSession() {
		try {
			auth.user = await getMe()
			return true
		} catch {
			await clearToken()
			return false
		}
	}

	function finishAuth() {
		auth.isLoading = false
		initState = 'success'
	}

	function failAuth(err: unknown) {
		errorMessage = err instanceof Error ? err.message : m.error_generic()
		auth.error = errorMessage
		auth.isLoading = false
		initState = 'error'
	}
</script>

{#if initState === 'loading'}
	<div class="container">
		<Spinner size="xl" />
	</div>
{:else if initState === 'not-telegram'}
	<div class="container">
		<h1>{m.not_available_in_telegram()}</h1>
	</div>
{:else if initState === 'error'}
	<div class="container">
		<p>{m.error_generic()}</p>
		<p>{auth.error}</p>
	</div>
{:else if initState === 'success' && auth.isAuthenticated}
	{@render children?.()}
{/if}

<style>
	.container {
		height: 100dvh;
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
