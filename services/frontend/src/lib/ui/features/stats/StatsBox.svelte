<script lang="ts">
	import { Card } from '$lib/ui/components'

	interface Props {
		label: string
		value: string | number
	}

	const { label, value }: Props = $props()
</script>

<Card class="stats-box">
	<span class="label">{label}</span>
	<span class="value">{value}</span>
</Card>

<style>
	:global(.stats-box) {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.label {
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
	}

	.value {
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		color: var(--color-text);
		font-variant-numeric: tabular-nums;
	}
</style>
