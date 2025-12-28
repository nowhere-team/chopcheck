<script lang="ts">
	import { untrack } from 'svelte'
	import { fade } from 'svelte/transition'

	import type { BboxCoords } from '$lib/shared/bbox'
	import { addBboxPadding, transformBboxForRotation } from '$lib/shared/bbox'
	import { Spinner } from '$lib/ui/components'

	interface Props {
		imageUrl: string
		bbox: BboxCoords // [y_min, x_min, y_max, x_max] (norm or absolute)
		rotation?: 0 | 90 | 180 | 270
		imageWidth: number
		imageHeight: number
		class?: string
	}

	const {
		imageUrl,
		bbox,
		rotation = 0,
		imageWidth,
		imageHeight,
		class: className = ''
	}: Props = $props()

	// --- Logic ---

	let containerRef = $state<HTMLDivElement | null>(null)
	let containerWidth = $state(0)
	let containerHeight = $state(0)

	// Dragging state
	let isDragging = $state(false)
	let startX = 0
	let startY = 0
	let offsetX = $state(0)
	let offsetY = $state(0)

	// Transform Logic
	const cropData = $derived.by(() => {
		if (!imageWidth || !imageHeight) return null

		// 1. Transform bbox to current rotation space
		const transformedBbox = transformBboxForRotation(bbox, rotation, imageWidth, imageHeight)

		// 2. Add padding (15% visual context)
		const padding = Math.min(transformedBbox.width, transformedBbox.height) * 0.25
		const cropRect = addBboxPadding(
			transformedBbox,
			padding,
			// Dimensions need to be swapped if rotated 90/270
			rotation % 180 !== 0 ? imageHeight : imageWidth,
			rotation % 180 !== 0 ? imageWidth : imageHeight
		)

		// 3. Calculate scale to fit container height
		// We want the cropRect.height to match containerHeight (approx 200px)
		// But if container isn't mounted yet, assume generic height
		const targetHeight = containerHeight || 200
		const scale = targetHeight / cropRect.height

		return {
			scale,
			// Initial position to center the crop
			initialLeft: -cropRect.left * scale,
			initialTop: -cropRect.top * scale,
			// Width of the visible crop area in pixels
			visualWidth: cropRect.width * scale,
			visualHeight: cropRect.height * scale
		}
	})

	// Drag Handlers
	function handleStart(e: TouchEvent | MouseEvent) {
		isDragging = true
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
		startX = clientX - offsetX
		startY = clientY - offsetY
	}

	function handleMove(e: TouchEvent | MouseEvent) {
		if (!isDragging || !cropData) return
		e.preventDefault() // prevent scroll

		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

		const rawX = clientX - startX
		const rawY = clientY - startY

		// Limit dragging to logical bounds (don't let user drag image completely out)
		// Simple limitation: allow dragging up to 50% of the view
		const limitX = containerWidth / 2
		const limitY = containerHeight / 4

		offsetX = Math.max(-limitX, Math.min(limitX, rawX))
		offsetY = Math.max(-limitY, Math.min(limitY, rawY))
	}

	function handleEnd() {
		isDragging = false
	}

	// Observer for container size
	$effect(() => {
		if (containerRef) {
			const obs = new ResizeObserver(entries => {
				const rect = entries[0].contentRect
				containerWidth = rect.width
				containerHeight = rect.height
			})
			obs.observe(containerRef)
			return () => obs.disconnect()
		}
	})

	// Reset drag when image changes
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		imageUrl
		untrack(() => {
			offsetX = 0
			offsetY = 0
		})
	})
</script>

<div
	class="crop-wrapper {className}"
	bind:this={containerRef}
	ontouchstart={handleStart}
	ontouchmove={handleMove}
	ontouchend={handleEnd}
	onmousedown={handleStart}
	onmousemove={handleMove}
	onmouseup={handleEnd}
	onmouseleave={handleEnd}
	role="img"
	aria-label="Фрагмент чека"
>
	{#if cropData}
		<div
			class="image-layer"
			style:transform="translate({cropData.initialLeft + offsetX}px, {cropData.initialTop +
				offsetY}px)"
			class:dragging={isDragging}
		>
			<img
				src={imageUrl}
				alt=""
				style:width="{rotation % 180 !== 0 ? imageHeight : imageWidth}px"
				style:height="{rotation % 180 !== 0 ? imageWidth : imageHeight}px"
				style:transform="scale({cropData.scale}) rotate({rotation}deg)"
				style:transform-origin="0 0"
				draggable="false"
			/>
		</div>

		<!-- UI Overlay (Fixed on top of image) -->
		<div class="overlay-layer">
			<!-- Google Lens Corners -->
			<div class="lens-box" style:width="{cropData.visualWidth}px">
				<div class="corner tl"></div>
				<div class="corner tr"></div>
				<div class="corner bl"></div>
				<div class="corner br"></div>
			</div>

			<!-- Edges fade -->
			<div class="fade-mask left"></div>
			<div class="fade-mask right"></div>
		</div>
	{:else}
		<div class="loading" transition:fade>
			<Spinner size="lg" variant="muted" />
		</div>
	{/if}
</div>

<!--suppress CssInvalidPropertyValue -->
<style>
	.crop-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: #000; /* Dark background for better contrast */
		border-radius: var(--radius-lg);
		touch-action: none; /* Important for drag */
		user-select: none;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.image-layer {
		position: absolute;
		top: 0;
		left: 0;
		will-change: transform;
		transform-origin: 0 0;
		transition: transform 0.2s cubic-bezier(0.1, 0.9, 0.2, 1);
	}

	.image-layer.dragging {
		transition: none;
	}

	img {
		display: block;
		pointer-events: none;
		/* Ensure rotation happens around center if needed, but here we handle it via bbox transform logic */
		image-rendering: -webkit-optimize-contrast;
	}

	.overlay-layer {
		position: absolute;
		inset: 0;
		pointer-events: none; /* Let clicks pass through to drag */
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Lens Box */
	.lens-box {
		position: relative;
		height: 100%;
		max-width: 90%;
		/* Optional: minimal shadow to separate from bg */
		box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4);
	}

	.corner {
		position: absolute;
		width: 20px;
		height: 20px;
		border-color: white;
		border-style: solid;
		border-width: 0;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
	}

	.tl {
		top: 0;
		left: 0;
		border-top-width: 3px;
		border-left-width: 3px;
		border-top-left-radius: 4px;
	}
	.tr {
		top: 0;
		right: 0;
		border-top-width: 3px;
		border-right-width: 3px;
		border-top-right-radius: 4px;
	}
	.bl {
		bottom: 0;
		left: 0;
		border-bottom-width: 3px;
		border-left-width: 3px;
		border-bottom-left-radius: 4px;
	}
	.br {
		bottom: 0;
		right: 0;
		border-bottom-width: 3px;
		border-right-width: 3px;
		border-bottom-right-radius: 4px;
	}

	/* Fades */
	.fade-mask {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 40px;
		z-index: 10;
	}
	.left {
		left: 0;
		background: linear-gradient(to right, rgba(0, 0, 0, 0.8), transparent);
	}
	.right {
		right: 0;
		background: linear-gradient(to left, rgba(0, 0, 0, 0.8), transparent);
	}

	.loading {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg-secondary);
	}
</style>
