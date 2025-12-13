import { SvelteURLSearchParams } from 'svelte/reactivity'

import { api } from '$lib/services/api/client'
import {
	ApiError,
	type CreateSplitDto,
	type ItemSelection,
	type PaginatedResponse,
	type Split,
	type SplitItem,
	type SplitResponse,
	type SplitsByPeriod
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

	const groupedQuery = createQuery<SplitsByPeriod>(
		CACHE_KEYS.grouped,
		() => api.get<SplitsByPeriod>('splits/my?grouped=true'),
		{ ttl: 2 * 60 * 1000 }
	)

	const draftQuery = createQuery<SplitResponse | null>(
		CACHE_KEYS.draft,
		async () => {
			try {
				return await api.get<SplitResponse>('splits/draft')
			} catch (e) {
				if (e instanceof ApiError && e.isNotFound) {
					return null
				}
				throw e
			}
		},
		{ ttl: 60 * 1000, refetchOnMount: false }
	)

	function fetchById(id: string) {
		return createQuery<SplitResponse>(
			CACHE_KEYS.byId(id),
			() => api.get<SplitResponse>(`splits/${id}`),
			{ ttl: 60 * 1000 }
		)
	}

	function fetchByShortId(shortId: string) {
		return createQuery<SplitResponse>(
			CACHE_KEYS.byShortId(shortId),
			() => api.get<SplitResponse>(`splits/s/${shortId}`),
			{ ttl: 60 * 1000 }
		)
	}

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

	// Новый метод для привязки чека
	const linkReceipt = createMutation<SplitResponse, { splitId: string; receiptId: string }>(
		({ splitId, receiptId }) => api.post(`splits/${splitId}/receipts/${receiptId}`),
		{
			onSuccess: (data, { splitId }) => {
				// Инвалидируем кэш, чтобы обновить данные на UI
				cache.invalidate(CACHE_KEYS.byId(splitId))
				cache.invalidate(CACHE_KEYS.draft)
				// Если это был черновик, обновляем его данные напрямую
				if (data) {
					cache.set(CACHE_KEYS.draft, data)
				}
			}
		}
	)

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
		active: activeQuery,
		grouped: groupedQuery,
		draft: draftQuery,
		fetchById,
		fetchByShortId,

		createOrUpdate,
		publish,
		join,
		addItems,
		linkReceipt,
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
