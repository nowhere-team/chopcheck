<!-- file: services/frontend/src/routes/+page.svelte -->
<script lang="ts">
	import { getApp, getPlatform } from '$lib/app/context.svelte'

	const platform = getPlatform()
	const app = getApp()

	function testHaptic() {
		platform.haptic.impact('medium')
	}
</script>

<div class="home">
	<header>
		<h1>🍔 chopcheck</h1>
	</header>

	{#if app.user}
		<section class="card">
			<div class="user">
				{#if app.user.avatarUrl}
					<img src={app.user.avatarUrl} alt="" class="avatar" />
				{:else}
					<div class="avatar placeholder">
						{app.user.displayName}
					</div>
				{/if}
				<div class="user-info">
					<p class="name">{app.user.displayName}</p>
					{#if app.user.username}
						<p class="username">@{app.user.username}</p>
					{/if}
				</div>
			</div>
		</section>
	{/if}

	<section class="card">
		<h2>информация</h2>
		<dl class="info">
			<dt>платформа</dt>
			<dd>{platform.type}</dd>
			<dt>haptic</dt>
			<dd>{platform.hasFeature('haptic') ? '✓' : '✗'}</dd>
			<dt>cloud storage</dt>
			<dd>{platform.hasFeature('cloud_storage') ? '✓' : '✗'}</dd>
			<dt>qr scanner</dt>
			<dd>{platform.hasFeature('qr_scanner') ? '✓' : '✗'}</dd>
		</dl>
	</section>

	<section class="actions">
		<button onclick={testHaptic}>тест haptic</button>
		<button class="secondary" onclick={() => app.logout()}>выйти</button>
	</section>

	{#if app.debugLog.length > 0}
		<section class="card debug">
			<h2>лог</h2>
			<div class="log">
				{#each app.debugLog as line, i (i)}
					<div>{JSON.stringify(line)}</div>
				{/each}
			</div>
		</section>
	{/if}
</div>

<style>
	.home {
		padding: 1.5rem;
		max-width: 480px;
		margin: 0 auto;
	}

	header {
		margin-bottom: 1.5rem;
	}

	h1 {
		font-size: 1.5rem;
		margin: 0;
	}

	h2 {
		font-size: 1rem;
		margin: 0 0 1rem;
		color: var(--color-hint);
	}

	.card {
		padding: 1rem;
		background: var(--color-secondaryBg);
		border-radius: 12px;
		margin-bottom: 1rem;
	}

	.user {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		object-fit: cover;
	}

	.avatar.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-button);
		color: var(--color-buttonText);
		font-weight: 600;
		font-size: 1.25rem;
	}

	.user-info {
		flex: 1;
	}

	.name {
		margin: 0;
		font-weight: 600;
	}

	.username {
		margin: 0.25rem 0 0;
		color: var(--color-hint);
		font-size: 0.875rem;
	}

	.info {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.5rem 1rem;
		margin: 0;
	}

	.info dt {
		color: var(--color-hint);
	}

	.info dd {
		margin: 0;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	button {
		flex: 1;
		padding: 0.75rem 1rem;
		background: var(--color-button);
		color: var(--color-buttonText);
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		cursor: pointer;
	}

	button.secondary {
		background: transparent;
		color: var(--color-text);
		border: 1px solid var(--color-hint);
	}

	button:active {
		opacity: 0.8;
	}

	.debug {
		font-size: 0.75rem;
	}

	.log {
		font-family: monospace;
		font-size: 0.625rem;
		max-height: 200px;
		overflow-y: auto;
		background: var(--color-bg);
		padding: 0.5rem;
		border-radius: 4px;
	}

	.log div {
		white-space: nowrap;
	}
</style>
