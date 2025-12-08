import { SvelteURLSearchParams } from 'svelte/reactivity'

import { api } from '$lib/services/api/client'
import type {
	CreateSplitDto,
	ItemSelection,
	PaginatedResponse,
	Split,
	SplitItem,
	SplitResponse,
	SplitsByPeriod
} from '$lib/services/api/types'

import { cache } from '../cache.svelte'
import { createMutation, createQuery } from '../query.svelte'

const CACHE_KEYS = {
	active: 'splits:active',
	grouped: 'splits:grouped',
	draft: 'splits:draft',
	byId: (id: string) => `splits:${id}`,
	byShortId: (shortId: string) => `splits:short:${shortId}`
}

export function createSplitsStore() {
	// active splits for home page
	const activeQuery = createQuery<Split[]>(
		CACHE_KEYS.active,
		async () => {
			const response = await api.get<PaginatedResponse<Split>>(
				'splits/my?status=active&limit=10'
			)
			return response.splits ?? response.data ?? []
		},
		{ ttl: 2 * 60 * 1000 }
	)

	// grouped splits for history
	const groupedQuery = createQuery<SplitsByPeriod>(
		CACHE_KEYS.grouped,
		() => api.get<SplitsByPeriod>('splits/my?grouped=true'),
		{ ttl: 2 * 60 * 1000 }
	)

	// current draft
	// const draftQuery = createQuery<SplitResponse | null>(
	// 	CACHE_KEYS.draft,
	// 	async () => {
	// 		try {
	// 			return await api.get<SplitResponse>('splits/draft')
	// 		} catch (e: any) {
	// 			if (e.status === 404) return null
	// 			throw e
	// 		}
	// 	},
	// 	{ ttl: 60 * 1000 }
	// )

	// fetch single split by id
	function fetchById(id: string) {
		return createQuery<SplitResponse>(
			CACHE_KEYS.byId(id),
			() => api.get<SplitResponse>(`splits/${id}`),
			{ ttl: 60 * 1000 }
		)
	}

	// fetch by short id
	function fetchByShortId(shortId: string) {
		return createQuery<SplitResponse>(
			CACHE_KEYS.byShortId(shortId),
			() => api.get<SplitResponse>(`splits/s/${shortId}`),
			{ ttl: 60 * 1000 }
		)
	}

	// mutations
	const createOrUpdate = createMutation<SplitResponse, CreateSplitDto & { id?: string }>(
		async dto => {
			if (dto.id) {
				return api.patch<SplitResponse>(`splits/${dto.id}`, dto)
			}
			return api.post<SplitResponse>('splits', dto)
		},
		{
			invalidateKeys: [CACHE_KEYS.draft, CACHE_KEYS.active, CACHE_KEYS.grouped]
		}
	)

	const publish = createMutation<SplitResponse, string>(
		splitId => api.post<SplitResponse>(`splits/${splitId}/publish`),
		{
			invalidateKeys: ['splits:*']
		}
	)

	const join = createMutation<
		SplitResponse,
		{ splitId: string; anonymous?: boolean; displayName?: string }
	>(
		({ splitId, anonymous, displayName }) => {
			const params = new SvelteURLSearchParams()
			if (anonymous) params.set('anonymous', 'true')
			if (displayName) params.set('display_name', displayName)
			const query = params.toString()
			return api.get<SplitResponse>(`splits/${splitId}/join${query ? `?${query}` : ''}`)
		},
		{
			invalidateKeys: ['splits:*']
		}
	)

	const addItems = createMutation<
		SplitResponse,
		{ splitId: string; items: Omit<SplitItem, 'id'>[] }
	>(({ splitId, items }) => api.post<SplitResponse>(`splits/${splitId}/items`, { items }), {
		onSuccess: (_, { splitId }) => {
			cache.invalidate(CACHE_KEYS.byId(splitId))
			cache.invalidate(CACHE_KEYS.draft)
		}
	})

	const selectItems = createMutation<
		SplitResponse,
		{ splitId: string; participantId?: string; selections: ItemSelection[] }
	>(
		({ splitId, participantId, selections }) =>
			api.post<SplitResponse>(`splits/${splitId}/select`, { participantId, selections }),
		{
			onSuccess: (_, { splitId }) => {
				cache.invalidate(CACHE_KEYS.byId(splitId))
			}
		}
	)

	const shareMessage = createMutation<
		{ preparedMessageId: string; splitId: string; shortId: string },
		string
	>(splitId => api.post(`splits/${splitId}/share`))

	function invalidateAll(): void {
		cache.invalidatePattern('splits:*')
	}

	return {
		// queries
		active: activeQuery,
		grouped: groupedQuery,
		// draft: draftQuery,
		fetchById,
		fetchByShortId,

		// mutations
		createOrUpdate,
		publish,
		join,
		addItems,
		selectItems,
		shareMessage,

		invalidateAll
	}
}

let splitsStore: ReturnType<typeof createSplitsStore> | null = null

export function getSplitsStore() {
	if (!splitsStore) {
		splitsStore = createSplitsStore()
	}
	return splitsStore
}
