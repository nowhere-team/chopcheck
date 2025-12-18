import { api } from '$api/client'
import type {
	AddSplitPaymentMethodDto,
	CreatePaymentMethodDto,
	PaymentMethod,
	SplitPaymentMethod,
	UpdatePaymentMethodDto
} from '$api/types'

// User payment methods

export async function getMyPaymentMethods(): Promise<PaymentMethod[]> {
	const response = await api.get<{ success: boolean; data: PaymentMethod[] }>('payment-methods')
	return response.data
}

export async function createPaymentMethod(dto: CreatePaymentMethodDto): Promise<PaymentMethod> {
	const response = await api.post<{ success: boolean; data: PaymentMethod }>('payment-methods', dto)
	return response.data
}

export async function updatePaymentMethod(
	id: string,
	dto: UpdatePaymentMethodDto
): Promise<PaymentMethod> {
	const response = await api.patch<{ success: boolean; data: PaymentMethod }>(
		`payment-methods/${id}`,
		dto
	)
	return response.data
}

export async function deletePaymentMethod(id: string): Promise<void> {
	await api.delete(`payment-methods/${id}`)
}

// Split payment methods

export async function getSplitPaymentMethods(splitId: string): Promise<SplitPaymentMethod[]> {
	const response = await api.get<{ success: boolean; data: SplitPaymentMethod[] }>(
		`splits/${splitId}/payment-methods`
	)
	return response.data
}

export async function addPaymentMethodToSplit(
	splitId: string,
	dto: AddSplitPaymentMethodDto
): Promise<void> {
	await api.post(`splits/${splitId}/payment-methods`, dto)
}

export async function removePaymentMethodFromSplit(
	splitId: string,
	paymentMethodId: string
): Promise<void> {
	await api.delete(`splits/${splitId}/payment-methods/${paymentMethodId}`)
}
