<script lang="ts">
	import { getPlatform } from '$lib/app/context.svelte'
	import Portal from '$lib/ui/overlays/Portal.svelte'

	import { toast } from './toast.svelte'
	import ToastItem from './ToastItem.svelte'

	const platform = getPlatform()
	const isTelegram = $derived(platform.type === 'telegram')
</script>

<Portal target="#portal-root">
	<div
		class="toast-container"
		class:telegram={isTelegram}
		class:web={!isTelegram}
		aria-live="polite"
		aria-atomic="true"
	>
		{#each toast.toasts as item (item.id)}
			<ToastItem {item} />
		{/each}
	</div>
</Portal>

<style>
	.toast-container {
		position: fixed;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		z-index: calc(var(--z-toast) + 10);
		pointer-events: none;
		width: 100%;
		max-width: 420px;
		padding: 0 var(--space-4);
	}

	.toast-container.telegram {
		top: calc(var(--safe-top) + 12px);
	}

	.toast-container.web {
		top: 24px;
	}
</style>
