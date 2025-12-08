<script lang="ts">
	import { getApp } from '$lib/app/context.svelte'

	const app = getApp()

	const consents = $derived(app.state.consents)
</script>

<div class="screen">
	<div class="logo">🍔</div>
	<h1>chopcheck</h1>
	<p class="hint">для продолжения необходимо принять условия</p>

	<div class="consents">
		{#each consents as consent (consent)}
			<label class="consent-item">
				<input
					type="checkbox"
					checked={consent.accepted}
					onchange={() => app.acceptConsent(consent.type)}
				/>
				<span>
					{consent.type === 'terms'
						? 'условия использования'
						: 'политика конфиденциальности'}
					{#if consent.required}<span class="required">*</span>{/if}
				</span>
			</label>
		{/each}
	</div>
</div>

<style>
	/*noinspection CssOverwrittenProperties*/
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

	.hint {
		color: var(--color-hint);
		margin: 0 0 2rem;
	}

	.consents {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		max-width: 320px;
	}

	.consent-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--color-secondaryBg);
		border-radius: 12px;
		cursor: pointer;
		user-select: none;
	}

	.consent-item input {
		width: 20px;
		height: 20px;
		margin: 0;
	}

	.required {
		color: #ef4444;
	}
</style>
