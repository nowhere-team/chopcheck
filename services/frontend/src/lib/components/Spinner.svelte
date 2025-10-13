<script lang="ts">
	interface Props {
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
		color?: string
	}

	const { size = 'md', color }: Props = $props()
</script>

<div
	class="spinner"
	class:xs={size === 'xs'}
	class:sm={size === 'sm'}
	class:md={size === 'md'}
	class:lg={size === 'lg'}
	class:xl={size === 'xl'}
	style:border-top-color={color}
	style:border-left-color={color}
></div>

<style>
	.spinner {
		border-radius: 50%;
		border: 2px solid var(--color-border-subtle);
		border-top-color: var(--color-button-primary-bg);
		border-left-color: var(--color-button-primary-bg);
		animation: spin 0.6s linear infinite;
	}

	.spinner.xs {
		width: 12px;
		height: 12px;
		border-width: 2px;
	}

	.spinner.sm {
		width: 16px;
		height: 16px;
		border-width: 2px;
	}

	.spinner.md {
		width: 24px;
		height: 24px;
		border-width: 3px;
	}

	.spinner.lg {
		width: 32px;
		height: 32px;
		border-width: 3px;
	}

	.spinner.xl {
		width: 48px;
		height: 48px;
		border-width: 4px;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
