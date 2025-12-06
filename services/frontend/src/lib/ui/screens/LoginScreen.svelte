<!-- file: services/frontend/src/lib/ui/screens/LoginScreen.svelte -->
<script lang="ts">
	import { getApp, getPlatform } from '$lib/app/context.svelte'
	import TelegramLoginButton from '$lib/ui/features/auth/TelegramLoginButton.svelte'

	const platform = getPlatform()
	const app = getApp()

	const showDebug = import.meta.env.DEV
	const debugEntries = $derived(app.debugLog)
</script>

<div class="screen">
	<div class="logo">🍔</div>
	<h1>chopcheck</h1>
	<p class="tagline">делим счета без головной боли</p>

	<div class="login-section">
		<p class="instruction">войдите через telegram для продолжения</p>
		<TelegramLoginButton />
	</div>

	{#if showDebug && debugEntries.length > 0}
		<div class="debug">
			<h3>отладка</h3>
			<dl>
				<dt>платформа</dt>
				<dd>{platform.type}</dd>
				<dt>статус</dt>
				<dd>{app.state.status}</dd>
			</dl>
			<div class="log">
				{#each debugEntries as entry, i (i)}
					<div class="log-entry" data-level={entry.level}>
						<span class="time">{entry.timestamp.toISOString().slice(11, 19)}</span>
						<span class="scope">[{entry.scope}]</span>
						<span class="msg">{entry.message}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		min-height: 100dvh;
		padding: 2rem;
		text-align: center;
	}

	.logo {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	h1 {
		margin: 0 0 0.5rem;
		font-size: 2rem;
	}

	.tagline {
		color: var(--color-hint);
		margin: 0 0 3rem;
	}

	.login-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.instruction {
		color: var(--color-hint);
		margin: 0;
	}

	.debug {
		margin-top: 3rem;
		padding: 1rem;
		background: var(--color-secondaryBg);
		border-radius: 8px;
		text-align: left;
		width: 100%;
		max-width: 400px;
		font-size: 0.75rem;
	}

	.debug h3 {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
	}

	.debug dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.25rem 0.5rem;
		margin: 0 0 0.5rem;
	}

	.debug dt {
		color: var(--color-hint);
	}

	.debug dd {
		margin: 0;
	}

	.log {
		font-family: monospace;
		font-size: 0.625rem;
		max-height: 150px;
		overflow-y: auto;
		background: var(--color-bg);
		padding: 0.5rem;
		border-radius: 4px;
	}

	.log-entry {
		white-space: nowrap;
		line-height: 1.4;
	}

	.log-entry[data-level='warn'] {
		color: #f59e0b;
	}

	.log-entry[data-level='error'] {
		color: #ef4444;
	}

	.time {
		opacity: 0.5;
		margin-right: 0.25rem;
	}

	.scope {
		color: var(--color-link);
		margin-right: 0.25rem;
	}
</style>
