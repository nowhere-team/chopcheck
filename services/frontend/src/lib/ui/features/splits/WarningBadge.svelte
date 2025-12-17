<script lang="ts">
	import { Warning } from 'phosphor-svelte'

	import { m } from '$lib/i18n'

	interface Props {
		count?: number
		size?: number
	}

	const { count = 1, size = 16 }: Props = $props()
</script>

<div class="warning-badge" title={m.warning_badge_title()}>
	<Warning {size} weight="fill" />
	{#if count > 1}
		<span class="count">{count}</span>
	{/if}
</div>

<style>
	.warning-badge {
		display: flex;
		align-items: center;
		gap: 2px;
		color: #d97706;
		animation: pulse-warning 2s ease-in-out infinite;
	}

	@keyframes pulse-warning {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}

	.count {
		font-size: var(--text-xs);
		font-weight: var(--font-semibold);
		color: #d97706;
	}
</style>
