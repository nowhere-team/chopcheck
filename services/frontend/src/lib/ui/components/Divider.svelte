<script lang="ts">
	interface Props {
		width?: number
		spacing?: 'sm' | 'md' | 'lg'
		color?: string
	}

	const { width = 100, spacing = 'md', color }: Props = $props()
</script>

<div class="divider-wrapper {spacing}">
	<div class="divider-line" style:width="{width}%" style:background-color={color}></div>
</div>

<style>
	.divider-wrapper {
		display: flex;
		justify-content: center;
		width: 100%;
	}

	.divider-wrapper.sm {
		padding: var(--space-2) 0;
	}

	.divider-wrapper.md {
		padding: var(--space-4) 0;
	}

	.divider-wrapper.lg {
		padding: var(--space-6) 0;
	}

	.divider-line {
		height: 1px;
		background: var(--color-border);
	}
</style>
