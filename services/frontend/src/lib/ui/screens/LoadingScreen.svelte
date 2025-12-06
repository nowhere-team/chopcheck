<!-- file: services/frontend/src/lib/ui/screens/LoadingScreen.svelte -->
<script lang="ts">
	interface Props {
		message?: string
	}

	const { message = 'загрузка...' }: Props = $props()
</script>

<div class="screen">
	<div class="spinner"></div>
	<p>{message}</p>
</div>

<style>
	.screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		min-height: 100dvh;
		gap: 1rem;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--color-secondaryBg);
		border-top-color: var(--color-button);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	p {
		color: var(--color-hint);
	}
</style>
