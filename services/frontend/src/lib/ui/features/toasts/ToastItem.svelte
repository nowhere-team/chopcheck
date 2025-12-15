<script lang="ts">
	import { CheckCircle, Info, Warning, X, XCircle } from 'phosphor-svelte'
	import { useInterval } from 'runed'
	import { type Component, onMount } from 'svelte'
	import { fly } from 'svelte/transition'

	import { getPlatform } from '$lib/app/context.svelte'
	import { m } from '$lib/i18n'
	import { Button } from '$lib/ui/components'

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

	let startX = $state(0)
	let currentX = $state(0)
	let dragging = $state(false)
	let el = $state<HTMLDivElement | null>(null)

	let progress = $state(100)
	let elapsed = 0
	const step = 40

	const progressTimer = useInterval(() => step, {
		immediate: false,
		callback: () => {
			if (item.duration <= 0) return
			elapsed += step
			progress = Math.max(0, 100 - (elapsed / item.duration) * 100)
			if (elapsed >= item.duration) {
				progressTimer.pause()
			}
		}
	})

	function handleDismiss() {
		platform.haptic.impact('light')
		toast.dismiss(item.id)
	}

	function onTouchStart(e: TouchEvent) {
		if (!item.dismissible) return
		startX = e.touches[0].clientX
		dragging = true
		progressTimer.pause()
	}

	function onTouchMove(e: TouchEvent) {
		if (!dragging) return
		currentX = e.touches[0].clientX - startX
		if (el) {
			el.style.transform = `translateX(${currentX}px)`
			el.style.opacity = `${Math.max(0.3, 1 - Math.abs(currentX) / 200)}`
		}
	}

	function onTouchEnd() {
		if (!dragging) return
		dragging = false
		if (Math.abs(currentX) > 80) {
			handleDismiss()
		} else {
			if (el) {
				el.style.transform = ''
				el.style.opacity = ''
			}
			progressTimer.resume()
		}
		currentX = 0
	}

	onMount(() => {
		if (item.duration > 0) {
			progressTimer.resume()
		}
	})
</script>

<!--suppress HtmlUnknownAttribute -->
<div
	bind:this={el}
	class="toast {item.type}"
	role="alert"
	in:fly={{ y: -20, duration: 250 }}
	out:fly={{ y: -20, duration: 200 }}
	ontouchstart={onTouchStart}
	ontouchmove={onTouchMove}
	ontouchend={onTouchEnd}
>
	<div class="content">
		<div class="icon-wrapper">
			<Icon size={20} weight="fill" />
		</div>
		<span class="message">{item.message}</span>
	</div>

	{#if item.dismissible}
		<Button
			variant="ghost"
			size="sm"
			class="dismiss"
			onclick={handleDismiss}
			aria-label={m.aria_close()}
		>
			{#snippet iconLeft()}
				<X size={16} />
			{/snippet}
		</Button>
	{/if}

	{#if item.duration > 0}
		<div class="progress" aria-hidden="true">
			<div class="bar" style="width: {progress}%"></div>
		</div>
	{/if}
</div>

<style>
	.toast {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-2) var(--space-4);
		background: var(--glass-bg);
		backdrop-filter: blur(var(--glass-blur)) saturate(180%);
		border: 1px solid var(--glass-border);
		border-radius: 12px;
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-text);
		min-width: 90%;
		pointer-events: auto;
		position: relative;
		overflow: hidden;
	}

	.content {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.icon-wrapper {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.toast.success .icon-wrapper {
		color: var(--color-success);
	}
	.toast.error .icon-wrapper {
		color: var(--color-error);
	}
	.toast.warning .icon-wrapper {
		color: #f59e0b;
	}

	.progress {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 3px;
		background: transparent;
	}

	.toast.success .progress .bar {
		background: linear-gradient(
			90deg,
			var(--color-success),
			color-mix(in srgb, var(--color-success) 30%, var(--color-bg))
		);
	}
	.toast.error .progress .bar {
		background: linear-gradient(
			90deg,
			var(--color-error),
			color-mix(in srgb, var(--color-error) 30%, var(--color-bg))
		);
	}
	.toast.warning .progress .bar {
		background: linear-gradient(
			90deg,
			#f59e0b,
			color-mix(in srgb, #f59e0b 30%, var(--color-bg))
		);
	}
	.toast.info .progress .bar {
		background: linear-gradient(
			90deg,
			var(--color-primary),
			color-mix(in srgb, var(--color-primary) 30%, var(--color-bg))
		);
	}

	.progress .bar {
		height: 100%;
		transition: width 120ms linear;
	}

	.dismiss {
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
