<script lang="ts">
	import Box from '$components/Box.svelte'

	interface Props {
		label: string
		value: unknown
	}

	const { label, value }: Props = $props()
</script>

<Box>
	<div class="content">
		<small class="label">{label}</small>
		<span class="value">{value}</span>
	</div>
</Box>

<style>
	.content {
		display: flex;
		flex-direction: column;
	}

	.value {
		font-weight: var(--font-semibold);
	}
</style>
