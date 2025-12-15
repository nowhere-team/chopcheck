<script>
	import { ShieldCheck } from 'phosphor-svelte'

	import { resolve } from '$app/paths'
	import { getApp } from '$lib/app/context.svelte'
	import { m } from '$lib/i18n'
	import { Button, Icon } from '$lib/ui/components'
	import Page from '$lib/ui/layouts/Page.svelte'

	const app = getApp()
	let loading = $state(false)

	async function handleAgree() {
		loading = true
		await app.acceptAllConsents()
	}
</script>

<Page safeTop={2.5}>
	<div class="content">
		<main>
			<Icon size={64} variant="placard" color="var(--color-primary)" class="mb-6">
				<ShieldCheck weight="fill" size={48} />
			</Icon>

			<h1>{m.consent_title()}</h1>
			<p>
				{m.consent_description()}
			</p>
			<p>
				{m.consent_privacy_prefix()}<a class="link" href={resolve('/privacy')}
					>{m.consent_privacy_link()}</a
				>{m.consent_privacy_suffix()}
			</p>
		</main>
		<footer>
			<Button variant="primary" class="w-full" onclick={handleAgree} {loading}
				>{m.consent_agree_button()}</Button
			>
		</footer>
	</div>
</Page>

<style>
	.content {
		display: flex;
		flex-direction: column;
		/*height: 100vh;*/
		/*background: var(--color-bg);*/
		overflow: hidden;
		flex-grow: 1;
	}
	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	h1 {
		font-size: var(--text-2xl);
		font-weight: var(--font-bold);
		color: var(--color-text);
		margin: 0;
	}

	strong {
		color: var(--color-primary);
		font-weight: var(--font-semibold);
	}

	.link {
		color: var(--color-primary);
		font-weight: var(--font-medium);
		text-decoration: underline;
		text-underline-offset: 4px;
		text-decoration-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
	}

	:global(.w-full) {
		width: 100%;
	}
</style>
