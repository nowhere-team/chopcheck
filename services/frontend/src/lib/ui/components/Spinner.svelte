<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg'
	}

	const { size = 'md' }: Props = $props()
</script>

<div class="spinner {size}"></div>

<style>
	.spinner {
		border-radius: 50%;
		border: 2px solid var(--color-border);
		border-top-color: var(--color-primary);
		animation: spin 0.7s linear infinite;
	}

	.sm {
		width: 16px;
		height: 16px;
	}

	.md {
		width: 24px;
		height: 24px;
		border-width: 3px;
	}

	.lg {
		width: 32px;
		height: 32px;
		border-width: 3px;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
