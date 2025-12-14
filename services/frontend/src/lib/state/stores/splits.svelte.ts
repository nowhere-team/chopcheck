import { resource } from 'runed'
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

export class SplitsService {
	private currentId = $state<string | null>(null)

	active = resource(
		() => 'active',
		async () => {
			const response = await api.get<PaginatedResponse<Split>>(
				'splits/my?status=active&limit=10'
			)
			return response.splits ?? response.data ?? []
		}
	)

	grouped = resource(
		() => 'grouped',
		async () => {
			return api.get<SplitsByPeriod>('splits/my?grouped=true')
		}
	)

	draft = resource(
		() => 'draft',
		async () => {
			try {
				return await api.get<SplitResponse>('splits/draft')
			} catch (e) {
				if (e instanceof ApiError && e.isNotFound) {
					return null
				}
				throw e
			}
		}
	)

	current = resource(
		() => this.currentId,
		async id => {
			if (!id) return null
			if (id.length < 10) {
				return api.get<SplitResponse>(`splits/s/${id}`)
			}
			return api.get<SplitResponse>(`splits/${id}`)
		}
	)

	setCurrentId(id: string) {
		this.currentId = id
	}

	async createOrUpdate(dto: CreateSplitDto & { id?: string }) {
		let res: SplitResponse
		if (dto.id) {
			res = await api.patch<SplitResponse>(`splits/${dto.id}`, dto)
		} else {
			res = await api.post<SplitResponse>('splits', dto)
		}

		await Promise.all([this.active.refetch(), this.grouped.refetch(), this.draft.refetch()])

		if (this.currentId === dto.id) {
			await this.current.refetch()
		}

		return res
	}

	async publish(splitId: string) {
		await api.post<SplitResponse>(`splits/${splitId}/publish`)
		await this.refreshAll()
	}

	async join(splitId: string, options?: { anonymous?: boolean; displayName?: string }) {
		const params = new SvelteURLSearchParams()
		if (options?.anonymous) params.set('anonymous', 'true')
		if (options?.displayName) params.set('display_name', options.displayName)
		const query = params.toString()

		await api.get<SplitResponse>(`splits/${splitId}/join${query ? `?${query}` : ''}`)
		await this.refreshAll()
	}

	async addItems(splitId: string, items: Omit<SplitItem, 'id'>[]) {
		await api.post<SplitResponse>(`splits/${splitId}/items`, { items })
		await this.refreshDetails(splitId)
	}

	async linkReceipt(splitId: string, receiptId: string) {
		const data = await api.post<SplitResponse>(`splits/${splitId}/receipts/${receiptId}`)

		if (this.draft.current?.split.id === splitId) {
			this.draft.mutate(data)
		}
		if (this.currentId === splitId) {
			this.current.mutate(data)
		}

		return data
	}

	async selectItems(
		splitId: string,
		payload: { participantId?: string; selections: ItemSelection[] }
	) {
		await api.post<SplitResponse>(`splits/${splitId}/select`, payload)
		if (this.currentId === splitId) {
			await this.current.refetch()
		}
	}

	async shareMessage(splitId: string) {
		return api.post<string>(`splits/${splitId}/share`)
	}

	async refreshAll() {
		await Promise.all([this.active.refetch(), this.grouped.refetch(), this.draft.refetch()])
		if (this.currentId) {
			await this.current.refetch()
		}
	}

	private async refreshDetails(splitId: string) {
		if (this.currentId === splitId) {
			await this.current.refetch()
		}
		if (this.draft.current?.split.id === splitId) {
			await this.draft.refetch()
		}
	}
}
