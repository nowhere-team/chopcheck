<script lang="ts">
	import Toast from '$components/Toast.svelte'
	import { getToastContext } from '$lib/contexts/toast.svelte'

	const toast = getToastContext()
</script>

<div class="toast-container">
	{#each toast.toasts as item (item.id)}
		<Toast toast={item} onremove={toast.remove} />
	{/each}
</div>

<!--suppress CssUnusedSymbol -->
<style>
	.toast-container {
		position: fixed;
		top: calc(var(--tg-inset-top) + var(--spacing-4-m));
		left: 50%;
		transform: translateX(-50%);
		z-index: 9999;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2-m);
		pointer-events: none;
	}

	.toast-container :global(.toast) {
		pointer-events: all;
	}
</style>
