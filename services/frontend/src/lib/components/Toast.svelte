<script lang="ts">
	import { CheckCircle, Warning, X, XCircle } from 'phosphor-svelte'
	import { fly } from 'svelte/transition'

	import type { Toast, ToastType } from '$lib/contexts/toast.svelte'

	interface Props {
		toast: Toast
		onremove: (id: string) => void
	}

	const { toast, onremove }: Props = $props()

	const icons: Record<ToastType, typeof CheckCircle> = {
		success: CheckCircle,
		error: XCircle,
		info: Warning
	}

	const Icon = $derived(icons[toast.type])
</script>

<div
	class="toast"
	class:success={toast.type === 'success'}
	class:error={toast.type === 'error'}
	class:info={toast.type === 'info'}
	role="alert"
	transition:fly={{ y: -20, duration: 200 }}
>
	<div class="toast-icon">
		<svelte:component this={Icon} size={24} weight="fill" />
	</div>

	<div class="toast-message">{toast.message}</div>

	<button class="toast-close" onclick={() => onremove(toast.id)} type="button">
		<X size={20} />
	</button>
</div>

<style>
	.toast {
		display: flex;
		align-items: center;
		gap: var(--spacing-3-m);
		padding: var(--spacing-3-m) var(--spacing-4-m);
		background: var(--color-bg-surface);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-default);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		min-width: 300px;
		max-width: 500px;
	}

	.toast.success {
		border-color: #10b981;
	}

	.toast.success .toast-icon {
		color: #10b981;
	}

	.toast.error {
		border-color: #ef4444;
	}

	.toast.error .toast-icon {
		color: #ef4444;
	}

	.toast.info {
		border-color: var(--color-button-primary-bg);
	}

	.toast.info .toast-icon {
		color: var(--color-button-primary-bg);
	}

	.toast-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.toast-message {
		flex: 1;
		font-size: var(--text-sm);
		color: var(--color-text-primary);
	}

	.toast-close {
		all: unset;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: var(--color-icon-default);
		border-radius: var(--radius-default);
		padding: var(--spacing-m);
		transition: background 150ms;
	}

	.toast-close:hover {
		background: var(--color-bg-surface-secondary);
	}
</style>
