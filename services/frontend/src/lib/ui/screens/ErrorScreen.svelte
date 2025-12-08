<script lang="ts">
	interface Props {
		error: Error
		onRetry?: () => void
	}

	const { error, onRetry }: Props = $props()
</script>

<div class="screen">
	<div class="icon">⚠️</div>
	<h1>что-то пошло не так</h1>
	<p class="message">{error.message}</p>

	{#if onRetry}
		<button onclick={onRetry}>попробовать снова</button>
	{/if}
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

	.icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	h1 {
		margin: 0 0 0.5rem;
		font-size: 1.5rem;
	}

	.message {
		color: var(--color-hint);
		margin: 0 0 2rem;
		max-width: 300px;
	}

	button {
		padding: 0.75rem 1.5rem;
		background: var(--color-button);
		color: var(--color-buttonText);
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		cursor: pointer;
	}

	button:active {
		opacity: 0.8;
	}
</style>
