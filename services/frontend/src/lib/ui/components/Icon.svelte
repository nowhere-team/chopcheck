<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		size?: number
		color?: string
		bg?: string // custom background color
		variant?: 'default' | 'placard'
		shape?: 'circle' | 'rounded' | 'square'
		class?: string
		'aria-hidden'?: boolean | 'true' | 'false'
		'aria-label'?: string
		children: Snippet
	}

	// eslint-disable-next-line svelte/no-unused-props
	const {
		size = 24,
		color,
		bg,
		variant = 'default',
		shape = 'rounded',
		class: className = '',
		'aria-hidden': ariaHidden = true,
		'aria-label': ariaLabel,
		children
	}: Props = $props()
</script>

<span
	class="icon-root {variant} {shape} {className}"
	style:width="{size}px"
	style:height="{size}px"
	style:color
	style:--icon-bg={bg}
	aria-hidden={!ariaLabel ? ariaHidden : undefined}
	aria-label={ariaLabel}
	role={ariaLabel ? 'img' : undefined}
>
	{@render children()}
</span>

<style>
	.icon-root {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		line-height: 1;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
	}

	.icon-root.default :global(svg) {
		width: 100%;
		height: 100%;
	}

	.icon-root.placard {
		background: var(--icon-bg, var(--color-bg-secondary));
	}

	.icon-root.placard[style*='color:'] {
		background: var(--icon-bg, color-mix(in srgb, currentColor 10%, transparent));
	}

	.icon-root.placard :global(svg) {
		width: 65%;
		height: 65%;
	}

	/* --- Shapes --- */
	.circle {
		border-radius: 50%;
	}

	.rounded {
		border-radius: 28%;
	}

	.square {
		border-radius: 0;
	}
</style>
