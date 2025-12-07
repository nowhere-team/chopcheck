<script lang="ts">
	import { fade, fly } from 'svelte/transition'

	import Portal from '$lib/ui/components/Portal.svelte'

	import { toast } from './toast.svelte'
</script>

<Portal target="#portal-root">
	<div class="toast-region">
		{#each toast.toasts as item (item.id)}
			<div
				class="toast {item.type}"
				in:fly={{ y: 20, duration: 300 }}
				out:fade={{ duration: 200 }}
				role="alert"
			>
				<span class="message">{item.message}</span>
			</div>
		{/each}
	</div>
</Portal>

<style>
	.toast-region {
		position: fixed;
		bottom: calc(var(--safe-bottom) + 90px); /* above navbar */
		left: 0;
		right: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		z-index: var(--z-toast);
		pointer-events: none;
		padding: 0 16px;
	}

	.toast {
		background: var(--color-bg-elevated);
		color: var(--color-text);
		padding: 12px 20px;
		border-radius: 50px;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.1),
			0 0 0 1px inset rgba(255, 255, 255, 0.1);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		pointer-events: auto;
		display: flex;
		align-items: center;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}

	.toast.error {
		background: color-mix(in srgb, var(--color-error) 15%, var(--color-bg-elevated));
		color: var(--color-error);
		border: 1px solid color-mix(in srgb, var(--color-error) 20%, transparent);
	}

	.toast.success {
		background: color-mix(in srgb, var(--color-success) 15%, var(--color-bg-elevated));
		color: var(--color-success);
		border: 1px solid color-mix(in srgb, var(--color-success) 20%, transparent);
	}
</style>
