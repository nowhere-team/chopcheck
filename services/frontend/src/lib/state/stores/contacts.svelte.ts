import { api } from '$lib/services/api/client'
import type { Contact } from '$lib/services/api/types'

import { cache } from '../cache.svelte'
import { createQuery } from '../query.svelte'

const CACHE_KEYS = {
	list: 'contacts:list',
	byId: (id: string) => `contacts:${id}`
}

export function createContactsStore() {
	const listQuery = createQuery<Contact[]>(
		CACHE_KEYS.list,
		async () => {
			const response = await api.get<{ success: boolean; data: Contact[] }>('contacts')
			return response.data
		},
		{ ttl: 5 * 60 * 1000 }
	)

	function fetchById(contactId: string) {
		return createQuery<Contact>(
			CACHE_KEYS.byId(contactId),
			async () => {
				const response = await api.get<{ success: boolean; data: Contact }>(
					`contacts/${contactId}`
				)
				return response.data
			},
			{ ttl: 5 * 60 * 1000 }
		)
	}

	function invalidateAll(): void {
		cache.invalidatePattern('contacts:*')
	}

	return {
		list: listQuery,
		fetchById,
		invalidateAll
	}
}

let contactsStore: ReturnType<typeof createContactsStore> | null = null

export function getContactsStore() {
	if (!contactsStore) {
		contactsStore = createContactsStore()
	}
	return contactsStore
}
