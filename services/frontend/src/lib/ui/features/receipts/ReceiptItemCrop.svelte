<script lang="ts">
	import { onMount, untrack } from 'svelte'

	import type { ImageMetadataDto, ItemBboxDto } from '$lib/services/api/types'
	import {
		addBboxPadding,
		denormalizeBbox,
		transformBboxForRotation,
		type TransformedBbox
	} from '$lib/shared/bbox'
	import { receiptImagesStore } from '$lib/state/stores/receipt-images.svelte'

	interface Props {
		receiptId: string
		bbox: ItemBboxDto | null
		height?: number
		class?: string
	}

	const { receiptId, bbox, height = 120, class: className = '' }: Props = $props()

	let containerRef = $state<HTMLDivElement | null>(null)
	let imageRef = $state<HTMLImageElement | null>(null)
	let containerWidth = $state(0)

	let imageUrl = $state<string | null>(null)
	let imageMeta = $state<ImageMetadataDto | null>(null)
	let imageDimensions = $state<{ width: number; height: number } | null>(null)
	let transformedBbox = $state<TransformedBbox | null>(null)

	let isLoading = $state(true)
	let hasError = $state(false)

	// drag state
	let isDragging = $state(false)
	let dragStartX = $state(0)
	let dragStartY = $state(0)
	// let offsetX = $state(0)
	// let offsetY = $state(0)
	let currentOffsetX = $state(0)
	let currentOffsetY = $state(0)

	const PADDING_RATIO = 0.15 // 15% padding around bbox

	async function loadImage() {
		if (!bbox) {
			isLoading = false
			return
		}

		isLoading = true
		hasError = false

		const data = await receiptImagesStore.load(receiptId)
		if (!data) {
			hasError = true
			isLoading = false
			return
		}

		const savedImage = data.savedImages.find(img => img.index === bbox.index)
		const metadata = data.imageMetadata.find(meta => meta.index === bbox.index)

		if (!savedImage?.url) {
			hasError = true
			isLoading = false
			return
		}

		imageUrl = savedImage.url
		imageMeta = metadata ?? null
	}

	function calculateTransformedBbox() {
		if (!bbox || !imageDimensions || !imageMeta) return

		const rotation = imageMeta.rotation ?? 0

		// determine original dimensions before rotation
		let origWidth = imageDimensions.width
		let origHeight = imageDimensions.height

		// if rotated 90 or 270, swap dimensions to get original
		if (rotation === 90 || rotation === 270) {
			;[origWidth, origHeight] = [origHeight, origWidth]
		}

		// check if bbox is normalized (0-1) or absolute
		const isNormalized = bbox.coords.every(c => c >= 0 && c <= 1)
		const coords = isNormalized
			? denormalizeBbox(bbox.coords, origWidth, origHeight)
			: bbox.coords

		// transform bbox for rotation
		const transformed = transformBboxForRotation(coords, rotation, origWidth, origHeight)

		// add padding
		const paddingPx = Math.min(transformed.width, transformed.height) * PADDING_RATIO
		transformedBbox = addBboxPadding(
			transformed,
			paddingPx,
			imageDimensions.width,
			imageDimensions.height
		)
	}

	function handleImageLoad() {
		if (!imageRef) return

		imageDimensions = {
			width: imageRef.naturalWidth,
			height: imageRef.naturalHeight
		}

		calculateTransformedBbox()
		isLoading = false
	}

	function handleImageError() {
		hasError = true
		isLoading = false
	}

	// drag handlers
	function handleTouchStart(e: TouchEvent) {
		if (!transformedBbox) return
		isDragging = true
		dragStartX = e.touches[0].clientX - currentOffsetX
		dragStartY = e.touches[0].clientY - currentOffsetY
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isDragging || !transformedBbox) return
		e.preventDefault()

		const newOffsetX = e.touches[0].clientX - dragStartX
		const newOffsetY = e.touches[0].clientY - dragStartY

		// calculate bounds
		const scale = height / transformedBbox.height
		const scaledWidth = transformedBbox.width * scale
		const maxOffsetX = Math.max(0, (scaledWidth - containerWidth) / 2 + 40)
		const maxOffsetY = 20

		currentOffsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newOffsetX))
		currentOffsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newOffsetY))
	}

	function handleTouchEnd() {
		isDragging = false
		offsetX = currentOffsetX
		offsetY = currentOffsetY
	}

	onMount(() => {
		if (containerRef) {
			const observer = new ResizeObserver(entries => {
				containerWidth = entries[0].contentRect.width
			})
			observer.observe(containerRef)
			return () => observer.disconnect()
		}
	})

	$effect(() => {
		if (bbox && receiptId) {
			untrack(() => loadImage())
		}
	})

	$effect(() => {
		if (imageDimensions && imageMeta && bbox) {
			calculateTransformedBbox()
		}
	})

	// computed styles for crop
	const cropStyle = $derived.by(() => {
		if (!transformedBbox || !imageDimensions) return null

		const scale = height / transformedBbox.height
		const scaledWidth = transformedBbox.width * scale
		const scaledImageWidth = imageDimensions.width * scale
		const scaledImageHeight = imageDimensions.height * scale

		return {
			containerWidth: scaledWidth,
			imageWidth: scaledImageWidth,
			imageHeight: scaledImageHeight,
			imageLeft: -transformedBbox.left * scale,
			imageTop: -transformedBbox.top * scale,
			translateX: currentOffsetX,
			translateY: currentOffsetY
		}
	})
</script>

{#if !bbox}
	<div class="no-bbox {className}">
		<span class="no-bbox-text">Изображение недоступно</span>
	</div>
{:else}
	<div
		bind:this={containerRef}
		class="crop-container {className}"
		style:height="{height}px"
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
		role="img"
		aria-label="Фрагмент чека"
	>
		{#if isLoading}
			<div class="loading-state">
				<div class="loading-shimmer"></div>
			</div>
		{:else if hasError}
			<div class="error-state">
				<span>📷</span>
			</div>
		{:else if cropStyle && imageUrl}
			<div
				class="crop-viewport"
				style:width="{cropStyle.containerWidth}px"
				style:transform="translate({cropStyle.translateX}px, {cropStyle.translateY}px)"
				class:dragging={isDragging}
			>
				<!-- edge fade masks -->
				<div class="fade-mask fade-left"></div>
				<div class="fade-mask fade-right"></div>
				<div class="fade-mask fade-top"></div>
				<div class="fade-mask fade-bottom"></div>

				<!-- corner brackets (google lens style) -->
				<div class="corner corner-tl"></div>
				<div class="corner corner-tr"></div>
				<div class="corner corner-bl"></div>
				<div class="corner corner-br"></div>

				<!-- image -->
				<img
					bind:this={imageRef}
					src={imageUrl}
					alt="Фрагмент чека"
					class="crop-image"
					style:width="{cropStyle.imageWidth}px"
					style:height="{cropStyle.imageHeight}px"
					style:left="{cropStyle.imageLeft}px"
					style:top="{cropStyle.imageTop}px"
					onload={handleImageLoad}
					onerror={handleImageError}
					draggable="false"
				/>
			</div>

			<!-- drag hint -->
			{#if cropStyle.containerWidth > containerWidth}
				<div class="drag-hint">
					<span class="drag-hint-text">←→</span>
				</div>
			{/if}
		{/if}
	</div>
{/if}

<style>
	.crop-container {
		position: relative;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
		border-radius: var(--radius-lg);
		background: var(--color-bg-secondary);
		touch-action: pan-x pan-y;
	}

	.crop-viewport {
		position: relative;
		height: 100%;
		overflow: hidden;
		border-radius: var(--radius-md);
		transition: transform 0.1s ease-out;
	}

	.crop-viewport.dragging {
		transition: none;
	}

	.crop-image {
		position: absolute;
		pointer-events: none;
		user-select: none;
		-webkit-user-drag: none;
	}

	/* fade masks for edge blur effect */
	.fade-mask {
		position: absolute;
		z-index: 2;
		pointer-events: none;
	}

	.fade-left {
		left: 0;
		top: 0;
		bottom: 0;
		width: 24px;
		background: linear-gradient(to right, var(--color-bg-secondary) 0%, transparent 100%);
	}

	.fade-right {
		right: 0;
		top: 0;
		bottom: 0;
		width: 24px;
		background: linear-gradient(to left, var(--color-bg-secondary) 0%, transparent 100%);
	}

	.fade-top {
		top: 0;
		left: 0;
		right: 0;
		height: 16px;
		background: linear-gradient(to bottom, var(--color-bg-secondary) 0%, transparent 100%);
	}

	.fade-bottom {
		bottom: 0;
		left: 0;
		right: 0;
		height: 16px;
		background: linear-gradient(to top, var(--color-bg-secondary) 0%, transparent 100%);
	}

	/* google lens style corner brackets */
	.corner {
		position: absolute;
		width: 20px;
		height: 20px;
		z-index: 3;
		pointer-events: none;
	}

	.corner::before,
	.corner::after {
		content: '';
		position: absolute;
		background: var(--color-primary);
		border-radius: 2px;
	}

	.corner-tl {
		top: 4px;
		left: 4px;
	}
	.corner-tl::before {
		top: 0;
		left: 0;
		width: 16px;
		height: 3px;
	}
	.corner-tl::after {
		top: 0;
		left: 0;
		width: 3px;
		height: 16px;
	}

	.corner-tr {
		top: 4px;
		right: 4px;
	}
	.corner-tr::before {
		top: 0;
		right: 0;
		width: 16px;
		height: 3px;
	}
	.corner-tr::after {
		top: 0;
		right: 0;
		width: 3px;
		height: 16px;
	}

	.corner-bl {
		bottom: 4px;
		left: 4px;
	}
	.corner-bl::before {
		bottom: 0;
		left: 0;
		width: 16px;
		height: 3px;
	}
	.corner-bl::after {
		bottom: 0;
		left: 0;
		width: 3px;
		height: 16px;
	}

	.corner-br {
		bottom: 4px;
		right: 4px;
	}
	.corner-br::before {
		bottom: 0;
		right: 0;
		width: 16px;
		height: 3px;
	}
	.corner-br::after {
		bottom: 0;
		right: 0;
		width: 3px;
		height: 16px;
	}

	.no-bbox,
	.loading-state,
	.error-state {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-tertiary);
		font-size: var(--text-sm);
	}

	.loading-shimmer {
		width: 80%;
		height: 60%;
		background: linear-gradient(
			90deg,
			var(--color-bg-tertiary) 0%,
			var(--color-bg-secondary) 50%,
			var(--color-bg-tertiary) 100%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s ease-in-out infinite;
		border-radius: var(--radius-md);
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	.drag-hint {
		position: absolute;
		bottom: 8px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 4;
	}

	.drag-hint-text {
		font-size: 10px;
		color: var(--color-text-tertiary);
		background: color-mix(in srgb, var(--color-bg) 80%, transparent);
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		backdrop-filter: blur(4px);
	}
</style>
