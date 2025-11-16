import { NotFoundError, ValidationError } from '@/common/errors'
import type { CreatePaymentMethodDto, PaymentMethods, UpdatePaymentMethodDto } from '@/common/types'
import type { Logger } from '@/platform/logger'
import type { PaymentMethodsRepository } from '@/repositories/payment-methods'

export class PaymentMethodsService {
	constructor(
		private paymentMethodsRepo: PaymentMethodsRepository,
		private logger: Logger,
	) {}

	async getMyPaymentMethods(userId: string): Promise<PaymentMethods[]> {
		return await this.paymentMethodsRepo.findByUserId(userId)
	}

	async createPaymentMethod(userId: string, dto: CreatePaymentMethodDto): Promise<PaymentMethods> {
		this.validatePaymentData(dto.type, dto.paymentData)

		const paymentMethod = await this.paymentMethodsRepo.create({
			userId,
			type: dto.type,
			displayName: dto.displayName || null,
			currency: dto.currency || 'RUB',
			paymentData: dto.paymentData,
			isTemporary: dto.isTemporary || false,
			isDefault: dto.isDefault || false,
		})

		this.logger.info('payment method created', {
			userId,
			paymentMethodId: paymentMethod.id,
			type: dto.type,
		})

		return paymentMethod
	}

	async updatePaymentMethod(
		paymentMethodId: string,
		userId: string,
		dto: UpdatePaymentMethodDto,
	): Promise<PaymentMethods> {
		const paymentMethod = await this.paymentMethodsRepo.findById(paymentMethodId)
		if (!paymentMethod) {
			throw new NotFoundError('payment method not found')
		}

		if (paymentMethod.userId !== userId) {
			throw new ValidationError('you can only update your own payment methods')
		}

		await this.paymentMethodsRepo.update(paymentMethodId, dto)

		this.logger.info('payment method updated', { userId, paymentMethodId })

		const updated = await this.paymentMethodsRepo.findById(paymentMethodId)
		if (!updated) {
			throw new NotFoundError('payment method not found after update')
		}

		return updated
	}

	async deletePaymentMethod(paymentMethodId: string, userId: string): Promise<void> {
		const paymentMethod = await this.paymentMethodsRepo.findById(paymentMethodId)
		if (!paymentMethod) {
			throw new NotFoundError('payment method not found')
		}

		if (paymentMethod.userId !== userId) {
			throw new ValidationError('you can only delete your own payment methods')
		}

		await this.paymentMethodsRepo.delete(paymentMethodId)

		this.logger.info('payment method deleted', { userId, paymentMethodId })
	}

	private validatePaymentData(type: string, paymentData: unknown): void {
		if (!paymentData || typeof paymentData !== 'object') {
			throw new ValidationError('paymentData must be an object')
		}

		const data = paymentData as Record<string, unknown>

		switch (type) {
			case 'sbp':
				if (!data.phone || typeof data.phone !== 'string') {
					throw new ValidationError('phone is required for sbp type')
				}
				break

			case 'card':
				if (!data.cardNumber || typeof data.cardNumber !== 'string') {
					throw new ValidationError('cardNumber is required for card type')
				}
				break

			case 'phone':
				if (!data.phoneNumber || typeof data.phoneNumber !== 'string') {
					throw new ValidationError('phoneNumber is required for phone type')
				}
				break

			case 'bank_transfer':
				if (!data.accountNumber || typeof data.accountNumber !== 'string') {
					throw new ValidationError('accountNumber is required for bank_transfer type')
				}
				break

			case 'cash':
			case 'crypto':
			case 'custom':
				break

			default:
				throw new ValidationError(`unknown payment method type: ${type}`)
		}
	}
}
