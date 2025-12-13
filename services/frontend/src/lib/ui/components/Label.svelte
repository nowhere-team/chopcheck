<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLAttributes } from 'svelte/elements'

	interface Props extends HTMLAttributes<HTMLElement> {
		for?: string
		children?: Snippet
	}

	const { for: forId, children, class: className, ...rest }: Props = $props()
</script>

<svelte:element
	this={forId ? 'label' : 'span'}
	for={forId}
	class="label {className ?? ''}"
	{...rest}
>
	{@render children?.()}
</svelte:element>

<!--suppress CssUnusedSymbol -->
<style>
	.label {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-text-secondary);
		margin-left: var(--space-1);
		display: inline-block;
	}
</style>
