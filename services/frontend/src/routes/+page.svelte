<script lang="ts">
	import { getApp, getPlatform } from '$lib/app/context.svelte'
	import { Button, Card } from '$lib/ui/components'
	import Page from '$lib/ui/layouts/Page.svelte'

	const platform = getPlatform()
	const app = getApp()

	function testHaptic(style: 'light' | 'medium' | 'heavy') {
		platform.haptic.impact(style)
	}
</script>

<Page title="chopcheck">
	{#if app.user}
		<Card>
			<div class="user-card">
				{#if app.user.avatarUrl}
					<img src={app.user.avatarUrl} alt="" class="avatar" />
				{:else}
					<div class="avatar placeholder">
						{app.user.displayName.slice(0, 2).toUpperCase()}
					</div>
				{/if}
				<div class="user-info">
					<p class="name">{app.user.displayName}</p>
					{#if app.user.username}
						<p class="username">@{app.user.username}</p>
					{/if}
				</div>
			</div>
		</Card>
	{/if}

	<Card>
		<h2 class="section-title">платформа</h2>
		<dl class="info-grid">
			<dt>тип</dt>
			<dd>{platform.type}</dd>
			<dt>haptic</dt>
			<dd>{platform.hasFeature('haptic') ? '✓' : '—'}</dd>
			<dt>cloud storage</dt>
			<dd>{platform.hasFeature('cloud_storage') ? '✓' : '—'}</dd>
			<dt>qr scanner</dt>
			<dd>{platform.hasFeature('qr_scanner') ? '✓' : '—'}</dd>
		</dl>
	</Card>

	<div class="actions">
		<Button variant="secondary" onclick={() => testHaptic('light')}>light</Button>
		<Button variant="secondary" onclick={() => testHaptic('medium')}>medium</Button>
		<Button variant="secondary" onclick={() => testHaptic('heavy')}>heavy</Button>
	</div>

	<Button variant="ghost" onclick={() => app.logout()}>выйти</Button>
</Page>

<style>
	.user-card {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.avatar {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		object-fit: cover;
	}

	.avatar.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-primary);
		color: var(--color-primary-text);
		font-weight: var(--font-semibold);
		font-size: var(--text-lg);
	}

	.user-info {
		flex: 1;
	}

	.name {
		font-weight: var(--font-semibold);
		font-size: var(--text-lg);
	}

	.username {
		color: var(--color-text-tertiary);
		font-size: var(--text-sm);
	}

	.section-title {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-text-tertiary);
		margin-bottom: var(--space-3);
	}

	.info-grid {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--space-2) var(--space-4);
	}

	.info-grid dt {
		color: var(--color-text-secondary);
	}

	.info-grid dd {
		margin: 0;
	}

	.actions {
		display: flex;
		gap: var(--space-2);
	}

	.actions :global(button) {
		flex: 1;
	}
</style>
