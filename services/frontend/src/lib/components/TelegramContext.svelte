<script lang="ts">
	import { isTMA } from '@telegram-apps/bridge'
	import { onMount } from 'svelte'

	import { authenticateWithTelegram, getMe } from '$api/auth'
	import { clearToken, getToken } from '$api/tokens'
	import { setAuthContext } from '$lib/contexts/auth.svelte'
	import { setTelegramContext } from '$lib/contexts/telegram.svelte'
	import { init } from '$telegram'

	const { children } = $props()

	let initState = $state<'loading' | 'success' | 'error' | 'not-telegram'>('loading')
	let errorMessage = $state('')

	const auth = setAuthContext()

	onMount(async () => {
		try {
			const tma = await isTMA('complete')
			if (!tma) {
				initState = 'not-telegram'
				return
			}

			const tg = await init()
			setTelegramContext(tg)

			// restore session
			const existingToken = await getToken()
			if (existingToken) {
				if (await tryRestoreSession()) {
					finishAuth()
					return
				}
			}

			// authenticate with telegram
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
		errorMessage = err instanceof Error ? err.message : 'unknown error'
		auth.error = errorMessage
		auth.isLoading = false
		initState = 'error'
	}
</script>

{#if initState === 'loading'}
	<p>Загрузка</p>
{:else if initState === 'not-telegram'}
	<p>Only Telegram</p>
{:else if initState === 'error'}
	<p>Ошибка</p>
{:else if initState === 'success' && auth.isAuthenticated}
	{@render children?.()}
{/if}
