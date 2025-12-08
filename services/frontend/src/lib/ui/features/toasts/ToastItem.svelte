<script lang="ts">
	import { CheckCircle, Info, Warning, X, XCircle } from 'phosphor-svelte'
	import type { Component } from 'svelte'
	import { fly } from 'svelte/transition'

	import { getPlatform } from '$lib/app/context.svelte'

	import { type Toast, toast, type ToastType } from './toast.svelte'

	interface Props {
		item: Toast
	}

	const { item }: Props = $props()
	const platform = getPlatform()

	const icons: Record<ToastType, Component> = {
		success: CheckCircle,
		error: XCircle,
		warning: Warning,
		info: Info
	}

	const Icon = $derived(icons[item.type])

	function handleDismiss() {
		platform.haptic.impact('light')
		toast.dismiss(item.id)
	}
</script>

<div
	class="toast {item.type}"
	role="alert"
	in:fly={{ y: 20, duration: 250 }}
	out:fly={{ y: -20, duration: 200 }}
>
	<span class="icon">
		<Icon size={20} weight="fill" />
	</span>

	<span class="message">{item.message}</span>

	{#if item.dismissible}
		<button class="dismiss" onclick={handleDismiss} aria-label="закрыть">
			<X size={16} />
		</button>
	{/if}
</div>

<style>
	.toast {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background: var(--glass-bg);
		backdrop-filter: blur(var(--glass-blur)) saturate(180%);
		-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
		border: 1px solid var(--glass-border);
		border-radius: 50px;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.12),
			0 0 0 1px rgba(255, 255, 255, 0.05) inset;
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-text);
		max-width: calc(100vw - 32px);
		pointer-events: auto;
	}

	.toast.success {
		border-color: color-mix(in srgb, var(--color-success) 30%, transparent);
	}

	.toast.success .icon {
		color: var(--color-success);
	}

	.toast.error {
		border-color: color-mix(in srgb, var(--color-error) 30%, transparent);
	}

	.toast.error .icon {
		color: var(--color-error);
	}

	.toast.warning {
		border-color: color-mix(in srgb, #f59e0b 30%, transparent);
	}

	.toast.warning .icon {
		color: #f59e0b;
	}

	.toast.info {
		border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
	}

	.toast.info .icon {
		color: var(--color-primary);
	}

	.icon {
		display: flex;
		flex-shrink: 0;
	}

	.message {
		flex: 1;
		min-width: 0;
	}

	.dismiss {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		color: var(--color-text-tertiary);
		cursor: pointer;
		transition: all 0.15s;
		flex-shrink: 0;
	}

	.dismiss:hover {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
	}

	.dismiss:active {
		transform: scale(0.9);
	}
</style>
