<script lang="ts">
	interface Props {
		spacing?: 'sm' | 'md' | 'lg'
	}

	const { spacing = 'md' }: Props = $props()
</script>

<div
	class="delimiter"
	class:sm={spacing === 'sm'}
	class:md={spacing === 'md'}
	class:lg={spacing === 'lg'}
></div>

<style>
	.delimiter {
		width: 100%;
		height: 1px;
		background: var(--color-border-default);
	}

	.delimiter.sm {
		margin: var(--spacing-2-m) 0;
	}

	.delimiter.md {
		margin: var(--spacing-4-m) 0;
	}

	.delimiter.lg {
		margin: var(--spacing-6-m) 0;
	}
</style>
