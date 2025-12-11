<script lang="ts">
	import emojiMapJson from 'fluent-optimized/map'
	import { onMount } from 'svelte'

	import {
		buildUnicodeWithSkinTone,
		type EmojiMap,
		emojiToUnicode,
		type EmojiVariant,
		getCachedImage,
		preloadImage,
		type SkinTone
	} from '$lib/shared/emoji'

	const emojiMap = emojiMapJson as EmojiMap

	interface Props {
		emoji: string
		size?: number
		variant?: EmojiVariant
		trimmed?: boolean
		skinTone?: SkinTone
		lazy?: boolean
		preload?: boolean
	}

	const {
		emoji,
		size = 32,
		variant = '3d',
		trimmed = true,
		skinTone = null,
		lazy = true,
		preload = false
	}: Props = $props()

	let container: HTMLElement
	let isVisible = $state(!lazy)
	let isLoaded = $state(false)
	let hasError = $state(false)

	const unicodeFromGlyph = $derived(emojiToUnicode(emoji))
	const entry = $derived(emojiMap[unicodeFromGlyph])

	const resolvedUnicode = $derived.by(() => {
		if (!entry) return null

		if (
			skinTone &&
			entry.hasSkinTones &&
			entry.skinTones?.includes(
				{
					light: '1f3fb',
					'medium-light': '1f3fc',
					medium: '1f3fd',
					'medium-dark': '1f3fe',
					dark: '1f3ff'
				}[skinTone] || ''
			)
		) {
			return buildUnicodeWithSkinTone(entry.unicode, skinTone)
		}

		return entry.unicode
	})

	const src = $derived.by(() => {
		if (!resolvedUnicode) return null

		if (variant === 'flat') {
			return `/emoji/flat/${entry?.unicode}.svg`
		}

		const subdir = trimmed ? 'trimmed' : 'original'
		return `/emoji/3d/${subdir}/${resolvedUnicode}.webp`
	})

	const isCached = $derived(src ? !!getCachedImage(src) : false)

	onMount(() => {
		if (!lazy) {
			isVisible = true
			return
		}

		const observer = new IntersectionObserver(
			entries => {
				if (entries[0].isIntersecting) {
					isVisible = true
					observer.disconnect()
				}
			},
			{
				rootMargin: '100px',
				threshold: 0
			}
		)

		observer.observe(container)

		return () => observer.disconnect()
	})

	$effect(() => {
		if (preload && src && !isCached) {
			preloadImage(src).catch(() => {})
		}
	})

	function handleLoad() {
		isLoaded = true
		hasError = false

		if (src) {
			preloadImage(src).catch(() => {})
		}
	}

	function handleError() {
		hasError = true
		isLoaded = false
	}
</script>

<span
	bind:this={container}
	class="emoji-wrapper"
	style:width="{size}px"
	style:height="{size}px"
	role="img"
	aria-label={entry?.cldr || emoji}
>
	{#if src && isVisible && !hasError}
		<img
			{src}
			alt=""
			class="emoji-img"
			class:loaded={isLoaded || isCached}
			width={size}
			height={size}
			loading={lazy ? 'lazy' : 'eager'}
			decoding="async"
			onload={handleLoad}
			onerror={handleError}
		/>
	{/if}

	{#if !isVisible || hasError || (!isLoaded && !isCached)}
		<span
			class="emoji-fallback"
			class:hidden={isLoaded || isCached}
			style:font-size="{size * 0.8}px"
		>
			{emoji}
		</span>
	{/if}
</span>

<style>
	.emoji-wrapper {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		position: relative;
		vertical-align: middle;
	}

	.emoji-img {
		display: block;
		object-fit: contain;
		opacity: 0;
		transition: opacity 150ms ease;
	}

	.emoji-img.loaded {
		opacity: 1;
	}

	.emoji-fallback {
		position: absolute;
		line-height: 1;
		transition: opacity 150ms ease;
	}

	.emoji-fallback.hidden {
		opacity: 0;
		pointer-events: none;
	}
</style>
