import { api } from '$api/client'
import type {
	AddItemDto,
	CreateSplitDto,
	ItemSelection,
	MyParticipation,
	MySplitsResponse,
	PaginationParams,
	Split,
	SplitsByPeriod,
	UpdateItemDto,
	UpdateSplitDto
} from '$api/types'

export async function getMySplits(
	params?: PaginationParams & { status?: 'draft' | 'active' | 'completed' }
): Promise<MySplitsResponse> {
	const searchParams = new URLSearchParams()

	if (params?.offset) searchParams.set('offset', params.offset.toString())
	if (params?.limit) searchParams.set('limit', params.limit.toString())
	if (params?.status) searchParams.set('status', params.status)

	const query = searchParams.toString()
	return await api.get<MySplitsResponse>(`splits/my${query ? `?${query}` : ''}`)
}

export async function getMySplitsGrouped(): Promise<SplitsByPeriod> {
	return await api.get<SplitsByPeriod>('splits/my?grouped=true')
}

export async function getEarlierSplits(params?: PaginationParams): Promise<MySplitsResponse> {
	const searchParams = new URLSearchParams({ period: 'earlier' })

	if (params?.offset) searchParams.set('offset', params.offset.toString())
	if (params?.limit) searchParams.set('limit', params.limit.toString())

	return await api.get<MySplitsResponse>(`splits/my?${searchParams.toString()}`)
}

export async function getSplitById(id: string): Promise<Split> {
	return await api.get<Split>(`splits/${id}`)
}

export async function createSplit(dto: CreateSplitDto): Promise<Split> {
	return await api.post<Split>('splits', dto)
}

export async function updateSplit(id: string, dto: UpdateSplitDto): Promise<Split> {
	return await api.patch<Split>(`splits/${id}`, dto)
}

export async function joinSplit(id: string): Promise<Split> {
	return await api.get<Split>(`splits/${id}/join`)
}

export async function addItems(splitId: string, items: AddItemDto[]): Promise<Split> {
	return await api.post<Split>(`splits/${splitId}/items`, { items })
}

export async function updateItem(
	splitId: string,
	itemId: string,
	dto: UpdateItemDto
): Promise<Split> {
	return await api.patch<Split>(`splits/${splitId}/items/${itemId}`, dto)
}

export async function deleteItem(splitId: string, itemId: string): Promise<Split> {
	return await api.delete<Split>(`splits/${splitId}/items/${itemId}`)
}

export async function selectItems(
	splitId: string,
	selections: ItemSelection[],
	participantId?: string
): Promise<Split> {
	return await api.post<Split>(`splits/${splitId}/select`, {
		participantId,
		selections
	})
}

export async function getMyParticipation(splitId: string): Promise<MyParticipation> {
	const response = await api.get<{ splits: MyParticipation }>(`splits/${splitId}/my`)
	return response.splits
}
