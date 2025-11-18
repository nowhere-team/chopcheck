import { api } from '$api/client'
import type { Split, SplitResponse } from '$api/types'

export async function getMyDraft(): Promise<Split | null> {
	try {
		const response = await api.get<SplitResponse>('splits/draft')
		return response.split
	} catch (error) {
		if (error instanceof Error && 'response' in error) {
			const response = (error as { response: Response }).response
			if (response.status === 404) {
				return null
			}
		}
		throw error
	}
}

export async function saveDraft(data: {
	id?: string
	name: string
	icon?: string
	currency: string
	items?: Array<{
		id?: string
		name: string
		price: number
		quantity: string
		type?: 'product' | 'tip' | 'delivery' | 'service_fee' | 'tax'
		defaultDivisionMethod: 'equal' | 'shares' | 'custom'
	}>
}): Promise<Split> {
	if (data.id) {
		// Update split metadata
		const response = await api.patch<SplitResponse>(`splits/${data.id}`, {
			name: data.name,
			icon: data.icon,
			currency: data.currency
		})

		// Replace all items if provided
		if (data.items !== undefined) {
			const itemsResponse = await api.put<SplitResponse>(`splits/${data.id}/items`, {
				items: data.items.map(item => ({
					name: item.name,
					price: item.price,
					quantity: item.quantity,
					type: item.type || 'product',
					defaultDivisionMethod: item.defaultDivisionMethod
				}))
			})
			return itemsResponse.split
		}

		return response.split
	}

	// Create new split with items
	const response = await api.post<SplitResponse>('splits', data)
	return response.split
}

export async function publishDraft(id: string) {
	try {
		await api.post(`splits/${id}/publish`)
	} catch (err) {
		throw new Error(err instanceof Error ? err.message : 'Failed to publish split')
	}
}
