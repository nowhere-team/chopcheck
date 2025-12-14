import { createLogger } from '$lib/shared/logger'

const log = createLogger('qr-scanner')

export interface QrScanResult {
	success: boolean
	data?: string
	error?: string
}

export async function scanQrCode(): Promise<QrScanResult> {
	try {
		const sdk = await import('@telegram-apps/sdk')

		if (!sdk.qrScanner.isSupported()) {
			return { success: false, error: 'QR scanner not supported' }
		}

		return new Promise(resolve => {
			sdk.qrScanner.open({
				text: 'Наведите камеру на QR-код чека',
				onCaptured(qr: any) {
					// fiscal qr codes start with t= or contain fn=
					if (qr.includes('t=') || qr.includes('fn=')) {
						log.info('valid fiscal qr captured', { length: qr.length })
						sdk.qrScanner.close()
						resolve({ success: true, data: qr })
					}
				}
			})

			// handle manual close
			setTimeout(() => {
				if (sdk.qrScanner.isOpened()) {
					// user might still be scanning
				}
			}, 30000)
		})
	} catch (e) {
		log.error('qr scanner error', e)
		return {
			success: false,
			error: e instanceof Error ? e.message : 'Unknown error'
		}
	}
}

export function closeQrScanner(): void {
	import('@telegram-apps/sdk').then(sdk => {
		if (sdk.qrScanner.isOpened()) {
			sdk.qrScanner.close()
		}
	})
}
