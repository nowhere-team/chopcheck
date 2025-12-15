import { resource } from 'runed'
import { SvelteURLSearchParams } from 'svelte/reactivity'

import { api } from '$lib/services/api/client'
import {
	ApiError,
	type CreateSplitDto,
	type ItemGroup,
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

	/**
	 * Optimistically updates the draft resource without waiting for the backend.
	 * Use this for immediate UI feedback.
	 */
	updateDraftLocal(data: { split?: Partial<Split>; items?: SplitItem[]; itemGroups?: ItemGroup[] }) {
		const current = this.draft.current
		if (!current) return

		this.draft.mutate({
			...current,
			split: data.split ? { ...current.split, ...data.split } : current.split,
			items: data.items ?? current.items,
			itemGroups: data.itemGroups ?? current.itemGroups
		})
	}

	async createOrUpdate(dto: CreateSplitDto & { id?: string }) {
		let res: SplitResponse
		if (dto.id) {
			res = await api.patch<SplitResponse>(`splits/${dto.id}`, dto)
		} else {
			res = await api.post<SplitResponse>('splits', dto)
		}

		// Mutate draft with the real server response
		if (this.draft.current?.split.id === res.split.id || !this.draft.current) {
			this.draft.mutate(res)
		}

		await Promise.all([this.active.refetch(), this.grouped.refetch()])

		if (this.currentId === dto.id) {
			await this.current.refetch()
		}

		return res
	}

	// === ATOMIC OPERATIONS START ===

	async addItem(splitId: string, item: Omit<SplitItem, 'id'>) {
		const res = await api.post<SplitResponse>(`splits/${splitId}/items`, { items: [item] })
		this.updateResourceAfterChange(splitId, res)
		return res
	}

	async updateItem(splitId: string, itemId: string, item: Partial<SplitItem>) {
		const res = await api.patch<SplitResponse>(`splits/${splitId}/items/${itemId}`, item)
		this.updateResourceAfterChange(splitId, res)
		return res
	}

	async deleteItem(splitId: string, itemId: string) {
		const res = await api.delete<SplitResponse>(`splits/${splitId}/items/${itemId}`)
		this.updateResourceAfterChange(splitId, res)
		return res
	}

	private updateResourceAfterChange(splitId: string, response: SplitResponse) {
		if (this.draft.current?.split.id === splitId) {
			this.draft.mutate(response)
		}
		if (this.currentId === splitId) {
			this.current.mutate(response)
		}
	}

	// === ATOMIC OPERATIONS END ===

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

	// Legacy bulk add (keep for receipts/bulk import)
	async addItems(splitId: string, items: Omit<SplitItem, 'id'>[]) {
		const res = await api.post<SplitResponse>(`splits/${splitId}/items`, { items })
		this.updateResourceAfterChange(splitId, res)
	}

	async linkReceipt(splitId: string, receiptId: string) {
		const data = await api.post<SplitResponse>(`splits/${splitId}/receipts/${receiptId}`)
		this.updateResourceAfterChange(splitId, data)
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

	async createGroup(splitId: string, data: { name: string; icon?: string; type?: ItemGroup['type'] }) {
		const res = await api.post<SplitResponse>(`splits/${splitId}/groups`, data)
		this.updateResourceAfterChange(splitId, res)
		return res
	}

	async updateGroup(splitId: string, groupId: string, data: Partial<Pick<ItemGroup, 'name' | 'icon' | 'isCollapsed'>>) {
		const res = await api.patch<SplitResponse>(`splits/${splitId}/groups/${groupId}`, data)
		this.updateResourceAfterChange(splitId, res)
		return res
	}

	async deleteGroup(splitId: string, groupId: string) {
		const res = await api.delete<SplitResponse>(`splits/${splitId}/groups/${groupId}`)
		this.updateResourceAfterChange(splitId, res)
		return res
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
