<script lang="ts">
	import { onMount } from 'svelte'

	import { receiptImagesStore } from '$lib/state/stores/receipt-images.svelte'
	import { Spinner } from '$lib/ui/components'

	interface Props {
		url: string
		receiptId: string
		imageIndex: number
		alt?: string
		class?: string
		onload?: (dimensions: { width: number; height: number }) => void
		onerror?: () => void
	}

	const {
		url,
		receiptId,
		imageIndex,
		alt = 'Фрагмент чека',
		class: className = '',
		onload,
		onerror
	}: Props = $props()

	let imgRef = $state<HTMLImageElement | null>(null)
	let currentUrl = $state(url)
	let isLoading = $state(true)
	let hasError = $state(false)
	let retryCount = $state(0)

	const MAX_RETRIES = 2

	async function handleError() {
		if (retryCount >= MAX_RETRIES) {
			hasError = true
			isLoading = false
			onerror?.()
			return
		}

		retryCount++
		isLoading = true

		// try to refresh the signed url
		const success = await receiptImagesStore.refresh(receiptId)
		if (success) {
			const newImage = receiptImagesStore.getImageForItem(receiptId, imageIndex)
			if (newImage?.url) {
				currentUrl = newImage.url
			}
		} else {
			hasError = true
			isLoading = false
			onerror?.()
		}
	}

	function handleLoad() {
		isLoading = false
		hasError = false

		if (imgRef) {
			const dimensions = {
				width: imgRef.naturalWidth,
				height: imgRef.naturalHeight
			}
			receiptImagesStore.setImageDimensions(currentUrl, dimensions)
			onload?.(dimensions)
		}
	}

	onMount(() => {
		// check if dimensions are already cached
		const cached = receiptImagesStore.getImageDimensions(url)
		if (cached) {
			onload?.(cached)
		}
	})

	$effect(() => {
		// reset on url change
		currentUrl = url
		retryCount = 0
		hasError = false
		isLoading = true
	})
</script>

<div class="receipt-image-container {className}">
	{#if isLoading && !hasError}
		<div class="loading-overlay">
			<Spinner size="sm" variant="muted" />
		</div>
	{/if}

	{#if hasError}
		<div class="error-state">
			<span class="error-icon">📷</span>
			<span class="error-text">Не удалось загрузить</span>
		</div>
	{:else}
		<img
			bind:this={imgRef}
			src={currentUrl}
			{alt}
			class="receipt-img"
			class:loaded={!isLoading}
			onload={handleLoad}
			onerror={handleError}
			draggable="false"
		/>
	{/if}
</div>

<style>
	.receipt-image-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.loading-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg-secondary);
	}

	.error-state {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		background: var(--color-bg-secondary);
		color: var(--color-text-tertiary);
	}

	.error-icon {
		font-size: 24px;
		opacity: 0.5;
	}

	.error-text {
		font-size: var(--text-xs);
	}

	.receipt-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.receipt-img.loaded {
		opacity: 1;
	}
</style>
