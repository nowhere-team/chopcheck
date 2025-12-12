<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg'
		variant?: 'default' | 'muted'
	}

	const { size = 'md', variant = 'default' }: Props = $props()
</script>

<div class="spinner {size} {variant}"></div>

<!--suppress CssUnusedSymbol -->
<style>
	.spinner {
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	.default {
		border: 2px solid var(--color-border);
		border-top-color: var(--color-primary);
	}

	.muted {
		border: 2px solid var(--color-border-subtle);
		border-top-color: var(--color-text-tertiary);
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
