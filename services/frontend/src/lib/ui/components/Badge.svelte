<script lang="ts">
	interface Props {
		count?: number
		size?: number
		glass?: boolean
	}

	const { count = 0, size = 22, glass = true }: Props = $props()

	const fontSize = $derived(size * 0.55)
	const padding = $derived(size * 0.27)
	const borderRadius = $derived(size / 2)
</script>

<span
	class="badge"
	class:glass
	style:height="{size}px"
	style:min-width="{size}px"
	style:padding="0 {padding}px"
	style:border-radius="{borderRadius}px"
	style:font-size="{fontSize}px"
>
	{count}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg-tertiary);
		font-weight: var(--font-semibold);
		color: var(--color-text-secondary);
	}

	.badge.glass {
		background: var(--glass-bg);
		backdrop-filter: blur(var(--glass-blur)) saturate(180%);
		-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
		border: 1px solid var(--glass-border);
	}
</style>
