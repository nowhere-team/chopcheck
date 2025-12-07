<script lang="ts">
	import type { Component } from 'svelte'

	interface Props {
		icon: Component
		size?: number
		color?: string
		'aria-hidden'?: boolean | 'true' | 'false'
		'aria-label'?: string
	}

	// eslint-disable-next-line svelte/no-unused-props
	const {
		icon: HostIcon,
		size = 24,
		color,
		'aria-hidden': ariaHidden = true,
		'aria-label': ariaLabel
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
	<HostIcon {size} />
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
