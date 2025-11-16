<script lang="ts">
	import { Camera, Image, QrCode } from 'phosphor-svelte'

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

	<button class="scan-option" onclick={onScanQR} type="button">
		<span class="scan-option-icon qr">
			<QrCode size={32} weight="bold" />
		</span>
		<span class="scan-option-content">
			<span class="scan-option-title">{m.create_split_scan_qr_title()}</span>
			<span class="scan-option-description">{m.create_split_scan_qr_description()}</span>
		</span>
	</button>

	<button class="scan-option" onclick={onTakePhoto} type="button">
		<span class="scan-option-icon photo">
			<Camera size={32} weight="bold" />
		</span>
		<span class="scan-option-content">
			<span class="scan-option-title">{m.create_split_scan_photo_title()}</span>
			<span class="scan-option-description">{m.create_split_scan_photo_description()}</span>
		</span>
	</button>

	<button class="scan-option" onclick={onUploadPhoto} type="button">
		<span class="scan-option-icon upload">
			<Image size={32} weight="bold" />
		</span>
		<span class="scan-option-content">
			<span class="scan-option-title">{m.create_split_scan_upload_title()}</span>
			<span class="scan-option-description">{m.create_split_scan_upload_description()}</span>
		</span>
	</button>
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

	.scan-option {
		all: unset;
		display: flex;
		align-items: center;
		gap: var(--spacing-4-m);
		padding: var(--spacing-4-m);
		background: var(--color-bg-surface-secondary);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-default);
		cursor: pointer;
		transition: all 150ms;
		-webkit-tap-highlight-color: transparent;
	}

	.scan-option:active {
		transform: scale(0.98);
		background: var(--color-bg-surface-selected);
	}

	.scan-option-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		border-radius: var(--radius-default);
		flex-shrink: 0;
		color: var(--color-button-primary-bg);
	}

	.scan-option-content {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-m);
		flex: 1;
		text-align: left;
	}

	.scan-option-title {
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		color: var(--color-text-primary);
	}

	.scan-option-description {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		line-height: 1.4;
	}
</style>
