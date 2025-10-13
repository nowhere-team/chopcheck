import { api } from '$api/client'
import type { MySplitsResponse } from '$api/types'

export async function getMySplits(): Promise<MySplitsResponse> {
	return await api.get<MySplitsResponse>('splits/my')
}
