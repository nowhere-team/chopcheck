<script lang="ts">
	import { Trash, X } from 'phosphor-svelte'
	import { fly } from 'svelte/transition'

	import { getPlatform } from '$lib/app/context.svelte'
	import { m } from '$lib/i18n'
	import { Button } from '$lib/ui/components'

	interface Props {
		count: number
		oncancel?: () => void
		ondelete?: () => void
	}

	const { count, oncancel, ondelete }: Props = $props()
	const platform = getPlatform()

	function handleCancel() {
		platform.haptic.impact('light')
		oncancel?.()
	}

	function handleDelete() {
		platform.haptic.notification('warning')
		ondelete?.()
	}
</script>

{#if count > 0}
	<div class="toolbar-wrapper" transition:fly={{ y: -60, duration: 250 }}>
		<div class="toolbar glass-panel">
			<div class="left">
				<Button variant="ghost" size="sm" onclick={handleCancel}>
					{#snippet iconLeft()}
						<X size={20} />
					{/snippet}
				</Button>
				<span class="count">{m.selection_count({ count: count })}</span>
			</div>

			<div class="actions">
				<Button variant="danger" size="sm" onclick={handleDelete}>
					{#snippet iconLeft()}
						<Trash size={18} />
					{/snippet}
					{m.action_delete()}
				</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.toolbar-wrapper {
		position: fixed;
		top: calc(var(--safe-top) + 50px);
		left: 50%;
		transform: translateX(-50%);
		z-index: calc(var(--z-navbar) + 10);
		width: calc(100% - 32px);
		max-width: 400px;
	}

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-2) var(--space-3);
		background: var(--glass-bg);
		backdrop-filter: blur(var(--glass-blur)) saturate(180%);
		-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
		border: 1px solid var(--glass-border);
		border-radius: 16px;
	}

	.left {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.count {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-text);
	}

	.actions {
		display: flex;
		gap: var(--space-2);
	}
</style>
