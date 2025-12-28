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

	const bboxPct = $derived.by(() => {
		const transformed = transformBboxForRotation(bbox, rotation)
		const dynamicPadding = Math.max(8, Math.min(transformed.width * 0.05, 20))
		const padded = addBboxPadding(transformed, dynamicPadding)
		return {
			left: padded.left / 10,
			top: padded.top / 10,
			width: padded.width / 10,
			height: padded.height / 10
		}
	})

	const imageScale = $derived.by(() => {
		if (!containerWidth || !imageWidth || !bboxPct.width) return 1

		const fitScale = containerWidth / imageWidth
		const bboxPixelWidth = (bboxPct.width / 100) * imageWidth
		const zoomScale = (containerWidth * 0.9) / bboxPixelWidth

		return Math.max(fitScale, zoomScale)
	})

	const scaledWidth = $derived(imageWidth * imageScale)
	const scaledHeight = $derived(imageHeight * imageScale)

	const bboxRect = $derived({
		left: (bboxPct.left / 100) * scaledWidth,
		top: (bboxPct.top / 100) * scaledHeight,
		width: (bboxPct.width / 100) * scaledWidth,
		height: (bboxPct.height / 100) * scaledHeight
	})

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
<!--suppress HtmlUnknownAttribute -->
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

<style>
	.viewport {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		touch-action: none;
		user-select: none;
		background: transparent;

		--fade-size: 15%;

		--mask-h: linear-gradient(
			to right,
			transparent,
			black var(--fade-size),
			black calc(100% - var(--fade-size)),
			transparent
		);

		--mask-v: linear-gradient(
			to bottom,
			transparent,
			black var(--fade-size),
			black calc(100% - var(--fade-size)),
			transparent
		);

		-webkit-mask-image: var(--mask-h), var(--mask-v);
		-webkit-mask-composite: source-in;

		mask-image: var(--mask-h), var(--mask-v);
		mask-composite: intersect;
	}

	.image-layer {
		position: absolute;
		top: 0;
		left: 0;
		will-change: transform;
		transition: transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1);
	}

	.image-layer.dragging {
		transition: none;
	}

	.image-layer img {
		display: block;
		pointer-events: none;
		max-width: none;
		max-height: none;
		filter: contrast(1.1) saturate(1.1) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
	}

	.bbox-corners {
		position: absolute;
		pointer-events: none;
	}

	.corner {
		position: absolute;
		width: 16px;
		height: 16px;
		border-color: var(--color-primary, #3b82f6);
		border-style: solid;
		border-width: 0;
		opacity: 0.7;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
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
