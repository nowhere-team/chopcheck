import { api } from '$api/client'
import type { Split } from '$api/types'

export async function getMyDraft(): Promise<Split | null> {
	try {
		return await api.get<Split>('splits/draft')
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
		defaultDivisionMethod: 'equal' | 'shares' | 'fixed' | 'proportional' | 'custom'
	}>
}): Promise<Split> {
	if (data.id) {
		return await api.patch<Split>(`splits/${data.id}`, {
			name: data.name,
			icon: data.icon,
			currency: data.currency,
			items: data.items
		})
	}

	return await api.post<Split>('splits', data)
}
