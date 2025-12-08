<script lang="ts">
	import Portal from '$lib/ui/components/Portal.svelte'

	import { toast } from './toast.svelte'
	import ToastItem from './ToastItem.svelte'
</script>

<Portal target="#portal-root">
	<div class="toast-container" aria-live="polite" aria-atomic="true">
		{#each toast.toasts as item (item.id)}
			<ToastItem {item} />
		{/each}
	</div>
</Portal>

<style>
	.toast-container {
		position: fixed;
		bottom: calc(var(--safe-bottom) + 90px);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		z-index: var(--z-toast);
		pointer-events: none;
		width: 100%;
		max-width: 400px;
		padding: 0 var(--space-4);
	}
</style>
