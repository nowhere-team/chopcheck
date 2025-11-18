<script lang="ts">
	import { shareMessage } from '@telegram-apps/sdk'
	import { ArrowRight, PaperPlaneTilt } from 'phosphor-svelte'

	import { createShareMessage } from '$api/splits'
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import BottomSheet from '$components/BottomSheet.svelte'
	import Button from '$components/Button.svelte'
	import { getToastContext } from '$lib/contexts/toast.svelte'
	import { m } from '$lib/i18n'
	import { haptic } from '$telegram/haptic'

	interface Props {
		open?: boolean
		onclose?: () => void
		splitId: string
		shortId: string
	}

	let { open = $bindable(false), onclose, splitId, shortId }: Props = $props()

	const toast = getToastContext()

	let isSharing = $state(false)

	async function handleShare() {
		if (isSharing) return

		try {
			isSharing = true
			haptic.medium()

			const { preparedMessageId } = await createShareMessage(splitId)

			if (shareMessage.isAvailable()) {
				await shareMessage(preparedMessageId)
			} else {
				toast.error(m.share_link_unavailable())
			}
		} catch (error) {
			haptic.error()
			const message =
				error instanceof Error ? error.message : m.share_link_message_creation_failed()
			toast.error(message)
		} finally {
			isSharing = false
		}
	}

	async function handleGoToSplit() {
		haptic.soft()
		open = false
		await goto(resolve(`/split/[id]`, { id: shortId }))
	}

	function handleClose() {
		open = false
		onclose?.()
	}
</script>

<BottomSheet
	bind:open
	onclose={handleClose}
	title={m.split_created_title()}
	subtitle={m.split_created_message()}
	height={40}
>
	<div class="content">
		<div class="share-section">
			<Button variant="primary" size="lg" onclick={handleShare} loading={isSharing}>
				{#snippet iconLeft()}
					<PaperPlaneTilt size={20} weight="fill" />
				{/snippet}
				{m.send_link_to_chat()}
			</Button>
			<Button variant="secondary" size="lg" onclick={handleGoToSplit}>
				{#snippet iconLeft()}
					<ArrowRight size={20} weight="bold" />
				{/snippet}
				{m.go_to_split()}
			</Button>
		</div>
	</div>
</BottomSheet>

<style>
	.content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-6-m);
		padding-top: var(--spacing-4-m);
	}

	.share-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-4-m);
	}

	.share-section :global(button) {
		width: 100%;
	}
</style>
