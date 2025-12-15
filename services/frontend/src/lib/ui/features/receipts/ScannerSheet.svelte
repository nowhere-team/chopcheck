<script lang="ts">
	import { Camera, QrCode } from 'phosphor-svelte'

	import { getPlatform } from '$lib/app/context.svelte'
	import { m } from '$lib/i18n'
	import { Button } from '$lib/ui/components'
	import { BottomSheet } from '$lib/ui/overlays'

	interface Props {
		open: boolean
		onclose?: () => void
		onscanqr?: () => void
		onuploadimage?: (file: File) => void
	}

	let { open = $bindable(), onclose, onscanqr, onuploadimage }: Props = $props()
	const platform = getPlatform()

	let fileInputRef: HTMLInputElement | null = $state(null)

	const canScanQr = $derived(platform.type === 'telegram' && platform.hasFeature('qr_scanner'))

	function handleScanQr() {
		platform.haptic.impact('medium')
		open = false
		onscanqr?.()
	}

	function handleUploadClick() {
		platform.haptic.selection()
		fileInputRef?.click()
	}

	function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement
		const file = input.files?.[0]
		if (file) {
			open = false
			onuploadimage?.(file)
		}
		input.value = ''
	}
</script>

<BottomSheet bind:open {onclose} title={m.create_split_scan_photo_title()}>
	<div class="scanner-options">
		{#if canScanQr}
			<Button variant="secondary" size="lg" onclick={handleScanQr}>
				{#snippet iconLeft()}
					<QrCode size={24} />
				{/snippet}
				{m.create_split_scan_qr_title()}
			</Button>
		{/if}

		<Button variant="secondary" size="lg" onclick={handleUploadClick}>
			{#snippet iconLeft()}
				<Camera size={24} />
			{/snippet}
			{m.create_split_scan_upload_title()}
		</Button>

		<input
			bind:this={fileInputRef}
			type="file"
			accept="image/*"
			capture="environment"
			class="hidden-input"
			onchange={handleFileChange}
		/>
	</div>
</BottomSheet>

<style>
	.scanner-options {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding-bottom: var(--space-4);
	}

	.hidden-input {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
