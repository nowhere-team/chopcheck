<script lang="ts">
	import { CaretDown } from 'phosphor-svelte'
	import type { Snippet } from 'svelte'

	import { getPlatform } from '$lib/app/context.svelte'
	import { Card } from '$lib/ui/components'

	interface Props {
		title: string
		onclick?: () => void
		children?: Snippet
		preview?: Snippet
		class?: string
	}

	const { title, onclick, children, preview, class: className }: Props = $props()
	const platform = getPlatform()

	function handleClick() {
		platform.haptic.selection()
		onclick?.()
	}
</script>

<Card interactive onclick={handleClick} class="expandable-card {className ?? ''}">
	<div class="card-content">
		<div class="main">
			<span class="title">{title}</span>
			{#if children}
				<div class="value">
					{@render children()}
				</div>
			{/if}
		</div>

		<div class="right">
			{#if preview}
				<div class="preview">
					{@render preview()}
				</div>
			{/if}
			<span class="caret">
				<CaretDown size={18} weight="bold" />
			</span>
		</div>
	</div>
</Card>

<style>
	:global(.expandable-card) {
		padding: var(--space-3) var(--space-4) !important;
	}

	.card-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.main {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.title {
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		color: var(--color-text);
	}

	.value {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
	}

	.right {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-shrink: 0;
	}

	.preview {
		display: flex;
		align-items: center;
	}

	.caret {
		display: flex;
		color: var(--color-text-tertiary);
		transform: rotate(-90deg);
	}
</style>
