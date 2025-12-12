<script lang="ts">
	import emojiMapJson from 'fluent-optimized/map'

	import {
		buildUnicodeWithSkinTone,
		type EmojiMap,
		emojiToUnicode,
		type EmojiVariant,
		type SkinTone
	} from '$lib/shared/emoji'

	import Spinner from './Spinner.svelte'

	const emojiMap = emojiMapJson as EmojiMap

	interface Props {
		emoji?: string
		size?: number
		variant?: EmojiVariant
		trimmed?: boolean
		skinTone?: SkinTone
		lazy?: boolean
		showSpinner?: boolean
	}

	const {
		emoji = '❓',
		size = 32,
		variant = '3d',
		trimmed = true,
		skinTone = null,
		lazy = true,
		showSpinner = false
	}: Props = $props()

	let imgRef: HTMLImageElement | null = $state(null)
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

	// reset state when src changes
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		src
		isLoaded = false
		hasError = false
	})

	// check if image is already loaded (from browser cache)
	$effect(() => {
		if (imgRef && imgRef.complete && imgRef.naturalWidth > 0) {
			isLoaded = true
		}
	})

	function handleLoad() {
		isLoaded = true
		hasError = false
	}

	function handleError() {
		hasError = true
		isLoaded = false
	}
</script>

<span
	class="emoji-wrapper"
	style:width="{size}px"
	style:height="{size}px"
	role="img"
	aria-label={entry?.cldr || emoji}
>
	{#if src && !hasError}
		<img
			bind:this={imgRef}
			{src}
			alt=""
			class="emoji-img"
			class:loaded={isLoaded}
			width={size}
			height={size}
			loading={lazy ? 'lazy' : 'eager'}
			decoding="async"
			onload={handleLoad}
			onerror={handleError}
		/>
	{/if}

	{#if !isLoaded && !hasError}
		{#if showSpinner}
			<div class="emoji-spinner">
				<Spinner size="sm" variant="muted" />
			</div>
		{:else}
			<span class="emoji-fallback" style:font-size="{size * 0.8}px">
				{emoji}
			</span>
		{/if}
	{/if}

	{#if hasError}
		<span class="emoji-fallback" style:font-size="{size * 0.8}px">
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

	.emoji-spinner {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.emoji-fallback {
		position: absolute;
		line-height: 1;
	}
</style>
