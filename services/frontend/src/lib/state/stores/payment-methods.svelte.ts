import { resource } from 'runed'
import { SvelteSet } from 'svelte/reactivity'

import { api } from '$lib/services/api/client'
import type {
	CreatePaymentMethodDto,
	PaymentMethod,
	UpdatePaymentMethodDto
} from '$lib/services/api/types'

interface PaymentMethodsResponse {
	success: boolean
	data: PaymentMethod[]
}

interface PaymentMethodResponse {
	success: boolean
	data: PaymentMethod
}

export class PaymentMethodsService {
	private currentSplitId = $state<string | null>(null)

	list = resource(
		() => 'payment-methods',
		async () => {
			const response = await api.get<PaymentMethodsResponse>('payment-methods')
			return response.data
		}
	)

	splitMethods = resource(
		() => this.currentSplitId,
		async splitId => {
			if (!splitId) return []
			try {
				const response = await api.get<PaymentMethodsResponse>(
					`splits/${splitId}/payment-methods`
				)
				return response.data
			} catch {
				return []
			}
		}
	)

	setSplitId(splitId: string | null) {
		this.currentSplitId = splitId
	}

	async create(dto: CreatePaymentMethodDto): Promise<PaymentMethod> {
		const response = await api.post<PaymentMethodResponse>('payment-methods', dto)
		await this.list.refetch()
		return response.data
	}

	async update(id: string, dto: UpdatePaymentMethodDto): Promise<PaymentMethod> {
		const response = await api.patch<PaymentMethodResponse>(`payment-methods/${id}`, dto)
		await this.list.refetch()
		return response.data
	}

	async delete(id: string): Promise<void> {
		await api.delete(`payment-methods/${id}`)
		await this.list.refetch()
	}

	async addToSplit(
		splitId: string,
		paymentMethodId: string,
		options?: { comment?: string; isPreferred?: boolean }
	): Promise<void> {
		await api.post(`splits/${splitId}/payment-methods`, {
			paymentMethodId,
			...options
		})
		if (this.currentSplitId === splitId) {
			await this.splitMethods.refetch()
		}
	}

	async removeFromSplit(splitId: string, paymentMethodId: string): Promise<void> {
		await api.delete(`splits/${splitId}/payment-methods/${paymentMethodId}`)
		if (this.currentSplitId === splitId) {
			await this.splitMethods.refetch()
		}
	}

	getSelectedIdsForSplit(): Set<string> {
		const methods = this.splitMethods.current ?? []
		return new SvelteSet(methods.map(m => m.id))
	}

	async refresh(): Promise<void> {
		await this.list.refetch()
		if (this.currentSplitId) {
			await this.splitMethods.refetch()
		}
	}
}
