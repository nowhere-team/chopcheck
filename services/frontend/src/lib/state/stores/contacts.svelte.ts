import { resource } from 'runed'

import { api } from '$lib/services/api/client'
import type { Contact } from '$lib/services/api/types'

export class ContactsService {
	private selectedId = $state<string | null>(null)

	list = resource(
		() => 'list',
		async () => {
			const response = await api.get<{ success: boolean; data: Contact[] }>('contacts')
			return response.data
		}
	)

	details = resource(
		() => this.selectedId,
		async id => {
			if (!id) return null
			const response = await api.get<{ success: boolean; data: Contact }>(`contacts/${id}`)
			return response.data
		}
	)

	select(id: string) {
		this.selectedId = id
	}

	async refresh() {
		await this.list.refetch()
	}
}
