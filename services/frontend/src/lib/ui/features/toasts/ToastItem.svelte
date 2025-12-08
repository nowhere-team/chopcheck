<script lang="ts">
	import { CheckCircle, Info, Warning, X, XCircle } from 'phosphor-svelte'
	import { type Component, onMount } from 'svelte'
	import { fly } from 'svelte/transition'

	import { getPlatform } from '$lib/app/context.svelte'
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
	let progressInterval = $state<number | null>(null)

	function handleDismiss() {
		platform.haptic.impact('light')
		toast.dismiss(item.id)
	}

	function onTouchStart(e: TouchEvent) {
		if (!item.dismissible) return
		startX = e.touches[0].clientX
		dragging = true
		if (progressInterval) {
			clearInterval(progressInterval)
			progressInterval = null
		}
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
			// resume progress
			startProgressCountdown()
		}
		currentX = 0
	}

	function startProgressCountdown() {
		if (item.duration <= 0) return
		const total = item.duration
		const step = 100
		const tick = Math.max(40, Math.floor(total / step))
		let elapsed = 0
		progress = 100
		progressInterval = setInterval(() => {
			elapsed += tick
			progress = Math.max(0, 100 - (elapsed / total) * 100)
			if (elapsed >= total) {
				clearInterval(progressInterval!)
				progressInterval = null
			}
		}, tick) as unknown as number // that's not node, its browser
	}

	onMount(() => {
		startProgressCountdown()
		return () => {
			if (progressInterval) clearInterval(progressInterval)
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
		<Icon size={20} weight="fill" />

		<span class="message">{item.message}</span>
	</div>

	{#if item.dismissible}
		<!--suppress JSUnusedGlobalSymbols -->
		<Button variant="ghost" size="sm" onclick={handleDismiss} aria-label="Закрыть">
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

	.progress {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 3px;
		background: transparent;
	}

	.progress .bar {
		height: 100%;
		background: linear-gradient(
			90deg,
			var(--color-primary),
			color-mix(in srgb, var(--color-primary) 30%, var(--color-bg))
		);
		transition: width 120ms linear;
	}
</style>
