<script lang="ts">
	import { untrack } from 'svelte'

	import type { BboxCoords } from '$lib/shared/bbox'
	import { addBboxPadding, transformBboxForRotation } from '$lib/shared/bbox'

	interface Props {
		imageUrl: string
		bbox: BboxCoords
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

	let containerRef = $state<HTMLDivElement | null>(null)
	let containerWidth = $state(0)
	let containerHeight = $state(0)

	let isDragging = $state(false)
	let startX = 0
	let startY = 0
	let translateX = $state(0)
	let translateY = $state(0)

	// bbox transformed and padded, in percentages 0-100
	const bboxPct = $derived.by(() => {
		const transformed = transformBboxForRotation(bbox, rotation)
		const padded = addBboxPadding(transformed, 30)
		return {
			left: padded.left / 10,
			top: padded.top / 10,
			width: padded.width / 10,
			height: padded.height / 10
		}
	})

	// scale image to fit container width with some padding
	const imageScale = $derived.by(() => {
		if (!containerWidth || !imageWidth) return 1
		return (containerWidth * 0.9) / imageWidth
	})

	const scaledWidth = $derived(imageWidth * imageScale)
	const scaledHeight = $derived(imageHeight * imageScale)

	// bbox rect in scaled pixels (for corner positioning)
	const bboxRect = $derived({
		left: (bboxPct.left / 100) * scaledWidth,
		top: (bboxPct.top / 100) * scaledHeight,
		width: (bboxPct.width / 100) * scaledWidth,
		height: (bboxPct.height / 100) * scaledHeight
	})

	// initial position: center bbox in viewport
	const initialX = $derived.by(() => {
		if (!containerWidth) return 0
		const bboxCenterX = bboxRect.left + bboxRect.width / 2
		return containerWidth / 2 - bboxCenterX
	})

	const initialY = $derived.by(() => {
		if (!containerHeight) return 0
		const bboxCenterY = bboxRect.top + bboxRect.height / 2
		return containerHeight / 2 - bboxCenterY
	})

	function handleStart(e: TouchEvent | MouseEvent) {
		isDragging = true
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
		startX = clientX - translateX
		startY = clientY - translateY
	}

	function handleMove(e: TouchEvent | MouseEvent) {
		if (!isDragging) return
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
		translateX = clientX - startX
		translateY = clientY - startY
	}

	function handleEnd() {
		isDragging = false
	}

	function dragAction(node: HTMLElement) {
		function onTouchMove(e: TouchEvent) {
			if (!isDragging) return
			e.preventDefault()
			handleMove(e)
		}
		node.addEventListener('touchmove', onTouchMove, { passive: false })
		return {
			destroy() {
				node.removeEventListener('touchmove', onTouchMove)
			}
		}
	}

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

	// reset position when image changes
	$effect(() => {
		void imageUrl
		void bbox
		untrack(() => {
			translateX = 0
			translateY = 0
		})
	})
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="viewport {className}"
	bind:this={containerRef}
	use:dragAction
	ontouchstart={handleStart}
	ontouchend={handleEnd}
	onmousedown={handleStart}
	onmousemove={handleMove}
	onmouseup={handleEnd}
	onmouseleave={handleEnd}
	role="img"
	aria-label="Фрагмент чека"
>
	<div
		class="image-layer"
		style:transform="translate({initialX + translateX}px, {initialY + translateY}px)"
		class:dragging={isDragging}
	>
		<img
			src={imageUrl}
			alt=""
			style:width="{scaledWidth}px"
			style:height="{scaledHeight}px"
			draggable="false"
		/>

		<!-- corners on bbox -->
		<div
			class="bbox-corners"
			style:left="{bboxRect.left}px"
			style:top="{bboxRect.top}px"
			style:width="{bboxRect.width}px"
			style:height="{bboxRect.height}px"
		>
			<div class="corner tl"></div>
			<div class="corner tr"></div>
			<div class="corner bl"></div>
			<div class="corner br"></div>
		</div>
	</div>
</div>

<!--suppress CssInvalidPropertyValue -->
<style>
	.viewport {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		touch-action: none;
		user-select: none;
		-webkit-mask-image: linear-gradient(
			to bottom,
			transparent 0%,
			black 15%,
			black 85%,
			transparent 100%
		);
		mask-image: linear-gradient(
			to bottom,
			transparent 0%,
			black 15%,
			black 85%,
			transparent 100%
		);
	}

	.image-layer {
		position: absolute;
		top: 0;
		left: 0;
		will-change: transform;
		transition: transform 0.15s cubic-bezier(0.2, 0.9, 0.3, 1);
	}

	.image-layer.dragging {
		transition: none;
	}

	.image-layer img {
		display: block;
		pointer-events: none;
		max-width: none;
		max-height: none;
		border-radius: 4px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
	}

	.bbox-corners {
		position: absolute;
		pointer-events: none;
	}

	.corner {
		position: absolute;
		width: 16px;
		height: 16px;
		border-color: white;
		border-style: solid;
		border-width: 0;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
	}

	.tl {
		top: -2px;
		left: -2px;
		border-top-width: 3px;
		border-left-width: 3px;
		border-top-left-radius: 4px;
	}

	.tr {
		top: -2px;
		right: -2px;
		border-top-width: 3px;
		border-right-width: 3px;
		border-top-right-radius: 4px;
	}

	.bl {
		bottom: -2px;
		left: -2px;
		border-bottom-width: 3px;
		border-left-width: 3px;
		border-bottom-left-radius: 4px;
	}

	.br {
		bottom: -2px;
		right: -2px;
		border-bottom-width: 3px;
		border-right-width: 3px;
		border-bottom-right-radius: 4px;
	}
</style>
