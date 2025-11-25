<script lang="ts">
	import Box from '$components/Box.svelte'
	import MarqueeText from '$components/MarqueeText.svelte'

	interface Props {
		label: string
		value: unknown
	}

	const { label, value }: Props = $props()
	const speed: number = 20
	const fadeWidth: number = 5
</script>

<Box>
	<div class="content">
		<div class="label-container">
			<MarqueeText {speed} {fadeWidth}>
				<small class="label">{label}</small>
			</MarqueeText>
		</div>

		<div class="value-container">
			<MarqueeText {speed} {fadeWidth}>
				<span class="value">{value}</span>
			</MarqueeText>
		</div>
	</div>
</Box>

<style>
	.content {
		display: flex;
		flex-direction: column;
		width: 100%;
		min-width: 0;
	}

	.label-container,
	.value-container {
		width: 100%;
		min-width: 0;
		overflow: hidden;
	}

	.value {
		font-weight: var(--font-semibold);
	}

	.label {
		color: var(--color-text-secondary);
	}
</style>
