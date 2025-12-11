import { NotFoundError, ValidationError } from '@/common/errors'
import type { CreatePaymentMethodDto, PaymentMethod, UpdatePaymentMethodDto } from '@/common/types'
import type { Logger } from '@/platform/logger'
import type { PaymentMethodsRepository } from '@/repositories'

export class PaymentMethodsService {
	constructor(
		private readonly repo: PaymentMethodsRepository,
		private readonly logger: Logger,
	) {}

	async getMyPaymentMethods(userId: string): Promise<PaymentMethod[]> {
		return this.repo.findByUserId(userId)
	}

	async create(userId: string, dto: CreatePaymentMethodDto): Promise<PaymentMethod> {
		this.validatePaymentData(dto.type, dto.paymentData)

		const pm = await this.repo.create({
			userId,
			type: dto.type,
			displayName: dto.displayName || null,
			currency: dto.currency || 'RUB',
			paymentData: dto.paymentData,
			isTemporary: dto.isTemporary || false,
			isDefault: dto.isDefault || false,
		})

		this.logger.info('payment method created', { userId, paymentMethodId: pm.id, type: dto.type })
		return pm
	}

	async update(paymentMethodId: string, userId: string, dto: UpdatePaymentMethodDto): Promise<PaymentMethod> {
		const pm = await this.repo.findById(paymentMethodId)
		if (!pm) throw new NotFoundError('payment method not found')
		if (pm.userId !== userId) throw new ValidationError('can only update own payment methods')

		await this.repo.update(paymentMethodId, dto)

		const updated = await this.repo.findById(paymentMethodId)
		return updated!
	}

	async delete(paymentMethodId: string, userId: string): Promise<void> {
		const pm = await this.repo.findById(paymentMethodId)
		if (!pm) throw new NotFoundError('payment method not found')
		if (pm.userId !== userId) throw new ValidationError('can only delete own payment methods')

		await this.repo.delete(paymentMethodId)
		this.logger.info('payment method deleted', { userId, paymentMethodId })
	}

	private validatePaymentData(type: string, data: Record<string, unknown>): void {
		if (!data || typeof data !== 'object') throw new ValidationError('paymentData must be an object')

		switch (type) {
			case 'sbp':
				if (!data.phone) throw new ValidationError('phone is required for sbp')
				break
			case 'card':
				if (!data.cardNumber) throw new ValidationError('cardNumber is required for card')
				break
			case 'phone':
				if (!data.phoneNumber) throw new ValidationError('phoneNumber is required for phone')
				break
			case 'bank_transfer':
				if (!data.accountNumber) throw new ValidationError('accountNumber is required for bank_transfer')
				break
		}
	}
}
