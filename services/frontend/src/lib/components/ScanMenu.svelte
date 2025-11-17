<script lang="ts">
	import { Camera, Image, QrCode } from 'phosphor-svelte'

	import Button from '$components/Button.svelte'
	import { m } from '$lib/i18n'

	interface Props {
		onScanQR: () => void
		onTakePhoto: () => void
		onUploadPhoto: () => void
	}

	const { onScanQR, onTakePhoto, onUploadPhoto }: Props = $props()
</script>

<div class="scan-menu">
	<h3 class="scan-menu-title">{m.create_split_scan_menu_title()}</h3>

	<!--suppress JSUnusedGlobalSymbols -->
	<Button variant="card" onclick={onScanQR}>
		{#snippet iconLeft()}
			<QrCode size={32} weight="regular" />
		{/snippet}
		{#snippet content()}
			<span class="title">{m.create_split_scan_qr_title()}</span>
			<span class="description">{m.create_split_scan_qr_description()}</span>
		{/snippet}
	</Button>

	<!--suppress JSUnusedGlobalSymbols -->
	<Button variant="card" onclick={onTakePhoto}>
		{#snippet iconLeft()}
			<Camera size={32} weight="regular" />
		{/snippet}
		{#snippet content()}
			<span class="title">{m.create_split_scan_photo_title()}</span>
			<span class="description">{m.create_split_scan_photo_description()}</span>
		{/snippet}
	</Button>

	<!--suppress JSUnusedGlobalSymbols -->
	<Button variant="card" onclick={onUploadPhoto}>
		{#snippet iconLeft()}
			<Image size={32} weight="regular" />
		{/snippet}
		{#snippet content()}
			<span class="title">{m.create_split_scan_upload_title()}</span>
			<span class="description">{m.create_split_scan_upload_description()}</span>
		{/snippet}
	</Button>
</div>

<style>
	.scan-menu {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-3-m);
		padding-top: var(--spacing-4-m);
	}

	.scan-menu-title {
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		color: var(--color-text-primary);
		margin-bottom: var(--spacing-2-m);
	}

	.title {
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		color: var(--color-text-primary);
		display: block;
		text-align: left;
		padding: 0;
	}

	.description {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		line-height: 1.4;
		display: block;
	}
</style>
