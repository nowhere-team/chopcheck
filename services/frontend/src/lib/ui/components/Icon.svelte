<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		size?: number
		color?: string
		'aria-hidden'?: boolean | 'true' | 'false'
		'aria-label'?: string
		children: Snippet
	}

	// eslint-disable-next-line svelte/no-unused-props
	const {
		size = 24,
		color,
		'aria-hidden': ariaHidden = true,
		'aria-label': ariaLabel,
		children
	}: Props = $props()
</script>

<span
	class="icon"
	style:color
	style:width="{size}px"
	style:height="{size}px"
	aria-hidden={!ariaLabel ? ariaHidden : undefined}
	aria-label={ariaLabel}
	role={ariaLabel ? 'img' : undefined}
>
	{@render children()}
</span>

<style>
	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: inherit;
	}
</style>
