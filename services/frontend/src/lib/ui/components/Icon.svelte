<script lang="ts">
	import type { Component } from 'svelte'

	interface Props {
		icon: Component
		size?: number
		color?: string
	}

	const { icon: HostIcon, size = 24, color }: Props = $props()
</script>

<span class="icon" style:color style:width="{size}px" style:height="{size}px">
	<HostIcon {size} />
</span>

<style>
	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: inherit;
	}
</style>
