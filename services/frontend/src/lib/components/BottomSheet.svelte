<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		isOpen: boolean
		onClose: () => void
		children?: Snippet
	}

	const { isOpen, onClose, children }: Props = $props()

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose()
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose()
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div class="backdrop" onclick={handleBackdropClick} role="dialog" aria-modal="true">
		<div class="sheet">
			{@render children?.()}
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		z-index: 100;
		animation: fade-in 150ms ease-out;
	}

	.sheet {
		width: 100%;
		max-width: 500px;
		background: var(--color-bg-page);
		border-radius: var(--radius-default) var(--radius-default) 0 0;
		animation: slide-up 200ms ease-out;
		max-height: 90vh;
		overflow: hidden;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
</style>
