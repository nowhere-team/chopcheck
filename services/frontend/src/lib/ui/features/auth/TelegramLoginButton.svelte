<script lang="ts">
	import { getApp, getPlatform } from '$lib/app/context.svelte.js'
	import { type TelegramLoginData, WebPlatform } from '$lib/platform/web/adapter'
	import { TELEGRAM_BOT_USERNAME } from '$lib/shared/constants'

	interface Props {
		size?: 'large' | 'medium' | 'small'
		radius?: number
	}

	const { size = 'large', radius = 8 }: Props = $props()

	const platform = getPlatform()
	const appInstance = getApp()

	let container = $state<HTMLDivElement>()

	function onTelegramAuth(user: TelegramLoginData) {
		if (platform instanceof WebPlatform) {
			platform.setTelegramLoginData(user)
			appInstance.setWebUser()
		}
	}

	$effect(() => {
		if (!container || platform.type !== 'web') return

		const callbackName = `onTelegramAuth_${Math.random().toString(36).slice(2)}`

		;(window as any)[callbackName] = onTelegramAuth

		const script = document.createElement('script')
		script.src = 'https://telegram.org/js/telegram-widget.js?22'
		script.async = true

		script.setAttribute('data-telegram-login', TELEGRAM_BOT_USERNAME)
		script.setAttribute('data-size', size)
		script.setAttribute('data-radius', String(radius))
		script.setAttribute('data-request-access', 'write')
		script.setAttribute('data-onauth', `${callbackName}(user)`)

		// eslint-disable-next-line
		container.innerHTML = ''
		// eslint-disable-next-line
		container.appendChild(script)

		return () => {
			delete (window as any)[callbackName]
		}
	})
</script>

{#if platform.type === 'web'}
	<div bind:this={container} class="telegram-login"></div>
{/if}

<style>
	.telegram-login {
		display: flex;
		justify-content: center;
		min-height: 40px;
	}
</style>
