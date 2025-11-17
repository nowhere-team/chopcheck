<script lang="ts">
	import { ArrowRight, Copy } from 'phosphor-svelte'

	import { goto } from '$app/navigation'
	import { getToastContext } from '$lib/contexts/toast.svelte'
	import { m } from '$lib/i18n'
	import { haptic } from '$telegram/haptic'

	import BottomSheet from './BottomSheet.svelte'
	import Button from './Button.svelte'

	interface Props {
		open?: boolean
		onclose: () => void
		splitId: string
		shortId: string
	}

	let { open = $bindable(false), onclose, splitId, shortId }: Props = $props()

	const toast = getToastContext()
	const shareUrl = $derived(() => {
		const baseUrl = window.location.origin
		return `${baseUrl}/s/${shortId}`
	})

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(shareUrl())
			haptic.success()
			toast.success(m.link_copied())
		} catch {
			haptic.error()
			toast.error(m.link_copy_failed())
		}
	}

	async function handleGoToSplit() {
		haptic.soft()
		open = false
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(`/split/${splitId}`)
	}
</script>

<BottomSheet bind:open {onclose} title={m.split_created_title()} height={50}>
	<div class="content">
		<div class="success-icon">✨</div>
		<p class="message">{m.split_created_message()}</p>

		<div class="link-section">
			<label class="label">{m.share_link_label()}</label>
			<div class="link-container">
				<input type="text" class="link-input" value={shareUrl()} readonly />
				<button class="copy-button" onclick={handleCopy} type="button">
					<Copy size={20} />
				</button>
			</div>
		</div>

		<div class="actions">
			<Button variant="primary" size="lg" onclick={handleGoToSplit}>
				{m.go_to_split()}
				<ArrowRight size={20} />
			</Button>
		</div>
	</div>
</BottomSheet>

<style lang="scss">
	.content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1rem;
	}

	.success-icon {
		font-size: 3rem;
		text-align: center;
		margin: 0.5rem 0;
	}

	.message {
		text-align: center;
		font-size: 1rem;
		color: var(--tg-theme-text-color, #000);
		margin: 0;
	}

	.link-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--tg-theme-hint-color, #999);
	}

	.link-container {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.link-input {
		flex: 1;
		padding: 0.75rem;
		font-size: 0.875rem;
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
		background: var(--tg-theme-secondary-bg-color, #f9f9f9);
		border: 1px solid var(--tg-theme-hint-color, #e0e0e0);
		border-radius: 8px;
		color: var(--tg-theme-text-color, #000);
		outline: none;

		&:focus {
			border-color: var(--tg-theme-button-color, #3390ec);
		}
	}

	.copy-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem;
		background: var(--tg-theme-button-color, #3390ec);
		border: none;
		border-radius: 8px;
		color: var(--tg-theme-button-text-color, #fff);
		cursor: pointer;
		transition: opacity 0.2s;

		&:hover {
			opacity: 0.8;
		}

		&:active {
			opacity: 0.6;
		}
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}
</style>
