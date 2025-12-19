<script lang="ts">
	import { X } from 'phosphor-svelte'
	import { cubicOut } from 'svelte/easing'
	import { fade, scale } from 'svelte/transition'

	import { Button, Emoji, Input } from '$lib/ui/components'
	import Portal from '$lib/ui/overlays/Portal.svelte'

	import { modal } from './store.svelte'

	let inputValue = $state('')

	$effect(() => {
		if (modal.current?.type === 'prompt') {
			inputValue = modal.current.inputValue ?? ''
		}
	})

	function handleButtonClick(value: unknown) {
		if (value === '__input__') {
			modal.close(inputValue)
		} else {
			modal.close(value)
		}
	}

	function handleBackdropClick() {
		if (modal.current?.dismissible) {
			modal.close(modal.current.type === 'confirm' ? false : null)
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && modal.current?.dismissible) {
			modal.close(modal.current.type === 'confirm' ? false : null)
		}
		if (e.key === 'Enter' && modal.current?.type === 'prompt') {
			modal.close(inputValue)
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if modal.current}
	<Portal target="#portal-root">
		<div class="modal-wrapper">
			<div
				class="backdrop"
				transition:fade={{ duration: 200 }}
				onclick={handleBackdropClick}
				role="presentation"
			></div>

			<div
				class="modal-content"
				transition:scale={{ duration: 250, easing: cubicOut, start: 0.9 }}
				role="dialog"
				aria-modal="true"
			>
				{#if modal.current.dismissible}
					<button class="close-btn" onclick={() => handleBackdropClick()}>
						<X size={18} />
					</button>
				{/if}

				{#if modal.current.icon}
					<div class="modal-icon">
						<Emoji emoji={modal.current.icon} size={48} />
					</div>
				{/if}

				{#if modal.current.title}
					<h2 class="modal-title">{modal.current.title}</h2>
				{/if}

				{#if modal.current.message}
					<p class="modal-message">{modal.current.message}</p>
				{/if}

				{#if modal.current.type === 'prompt'}
					<div class="modal-input">
						<Input
							bind:value={inputValue}
							placeholder={modal.current.inputPlaceholder}
							autofocus
						/>
					</div>
				{/if}

				{#if modal.current.buttons?.length}
					<div class="modal-actions" class:single={modal.current.buttons.length === 1}>
						{#each modal.current.buttons as btn (btn.label)}
							<Button
								variant={btn.variant ?? 'secondary'}
								onclick={() => handleButtonClick(btn.value)}
							>
								{btn.label}
							</Button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</Portal>
{/if}

<style>
	.modal-wrapper {
		position: fixed;
		inset: 0;
		z-index: calc(var(--z-modal) + 100);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
	}

	.backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
	}

	.modal-content {
		position: relative;
		background: var(--color-bg);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		width: 100%;
		max-width: 320px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: var(--space-3);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	}

	.close-btn {
		position: absolute;
		top: var(--space-3);
		right: var(--space-3);
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--color-bg-secondary);
		color: var(--color-text-tertiary);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.15s;
	}

	.close-btn:hover {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
	}

	.modal-icon {
		margin-bottom: var(--space-2);
	}

	.modal-title {
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		color: var(--color-text);
		margin: 0;
	}

	.modal-message {
		font-size: var(--text-base);
		color: var(--color-text-secondary);
		margin: 0;
		line-height: 1.5;
	}

	.modal-input {
		width: 100%;
		margin-top: var(--space-2);
	}

	.modal-actions {
		display: flex;
		gap: var(--space-3);
		width: 100%;
		margin-top: var(--space-3);
	}

	.modal-actions :global(button) {
		flex: 1;
	}

	.modal-actions.single {
		justify-content: center;
	}

	.modal-actions.single :global(button) {
		flex: none;
		min-width: 120px;
	}
</style>
