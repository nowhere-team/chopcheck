<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		children: Snippet
	}

	const { children }: Props = $props()
</script>

<div class="dropdown-menu">
	{@render children()}
</div>

<style>
	.dropdown-menu {
		display: flex;
		flex-direction: column;
		padding: var(--space-1);
		min-width: 160px;
	}
</style>
