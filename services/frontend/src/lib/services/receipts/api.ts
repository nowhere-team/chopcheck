import { api } from '$lib/services/api/client'
import type { ReceiptImagesResponse, ReceiptWithItems } from '$lib/services/api/types'
import { createLogger } from '$lib/shared/logger'

const log = createLogger('receipts-api')

export async function getReceipt(receiptId: string): Promise<ReceiptWithItems | null> {
	try {
		return await api.get<ReceiptWithItems>(`receipts/${receiptId}`)
	} catch (error) {
		log.error('failed to get receipt', { receiptId, error })
		return null
	}
}

export async function getReceiptImages(receiptId: string): Promise<ReceiptImagesResponse | null> {
	try {
		return await api.get<ReceiptImagesResponse>(`receipts/${receiptId}/images`)
	} catch (error) {
		log.error('failed to get receipt images', { receiptId, error })
		return null
	}
}

export async function refreshReceiptImages(
	receiptId: string
): Promise<ReceiptImagesResponse | null> {
	try {
		const response = await api.post<{
			success: boolean
			savedImages: ReceiptImagesResponse['savedImages']
		}>(`receipts/${receiptId}/images/refresh`)
		if (response.success) {
			return { receiptId, imageMetadata: [], savedImages: response.savedImages }
		}
		return null
	} catch (error) {
		log.error('failed to refresh receipt images', { receiptId, error })
		return null
	}
}
