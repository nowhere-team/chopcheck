import { ForbiddenError, NotFoundError, ValidationError } from '@/common/errors'
import type {
	Calculations,
	CreateSplitDto,
	Item,
	Participant,
	ParticipantCalculationData,
	Split,
	SplitData,
	SplitResponse,
	SplitsByPeriod,
	AddPaymentMethodToSplitDto,
	CreatePaymentMethodDto,
	PaymentMethod,
	UpdatePaymentMethodDto,
} from '@/common/types'
import type { Logger } from '@/platform/logger'
import type { ItemsRepository } from '@/repositories/items'
import type { ParticipantsRepository } from '@/repositories/participants'
import type { SplitsRepository } from '@/repositories/splits'
import type { StatsRepository } from '@/repositories/stats'
import type { PaymentMethodsRepository } from '@/repositories/payment-methods'
import { CalculationService } from '@/services/calculation'

export class SplitsService {
	constructor(
		private splitsRepo: SplitsRepository,
		private itemsRepo: ItemsRepository,
		private participantsRepo: ParticipantsRepository,
		private paymentMethodsRepo: PaymentMethodsRepository,
		private statsRepo: StatsRepository,
		private calcService: CalculationService,
		private logger: Logger,
	) {}

	async getById(splitId: string, includeCalculations = true): Promise<SplitResponse | null> {
		this.logger.debug('fetching split', { splitId })

		const [split, items, participants] = await Promise.all([
			this.splitsRepo.findById(splitId),
			this.itemsRepo.findBySplitId(splitId),
			this.participantsRepo.findBySplitId(splitId),
		])

		if (!split) return null

		const response: SplitResponse = { split, items, participants }

		if (includeCalculations) {
			response.calculations = this.buildCalculations(response)
		}

		return response
	}

	async getMySplitsGrouped(userId: string): Promise<SplitsByPeriod> {
		return await this.splitsRepo.findByUserGroupedByPeriod(userId)
	}

	async getEarlierSplits(userId: string, offset: number = 0, limit: number = 20): Promise<Split[]> {
		const now = new Date()
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
		startOfMonth.setHours(0, 0, 0, 0)

		return await this.splitsRepo.findByUser(userId, {
			offset,
			limit,
			before: startOfMonth,
		})
	}

	async updateItem(
		splitId: string,
		itemId: string,
		userId: string,
		data: Partial<Pick<Item, 'name' | 'price' | 'type' | 'quantity' | 'defaultDivisionMethod'>>,
	): Promise<SplitResponse | null> {
		const split = await this.splitsRepo.findById(splitId)
		if (!split) {
			throw new NotFoundError('split not found')
		}

		if (split.ownerId !== userId) {
			throw new ForbiddenError('only split owner can update items')
		}

		const item = await this.itemsRepo.findById(itemId)
		if (!item || item.splitId !== splitId) {
			return null
		}

		await this.itemsRepo.update(itemId, splitId, data)

		this.logger.info('item updated', {
			splitId,
			itemId,
			userId,
			changes: data,
		})

		const result = await this.getById(splitId, true)
		if (!result) {
			throw new NotFoundError('split not found after updating item')
		}

		return result
	}

	async deleteItem(splitId: string, itemId: string, userId: string): Promise<SplitResponse | null> {
		const split = await this.splitsRepo.findById(splitId)
		if (!split) {
			throw new NotFoundError('split not found')
		}

		if (split.ownerId !== userId) {
			throw new ForbiddenError('only split owner can delete items')
		}

		const item = await this.itemsRepo.findById(itemId)
		if (!item || item.splitId !== splitId) {
			return null
		}

		await this.itemsRepo.softDelete(itemId, splitId)

		this.logger.info('item deleted', {
			splitId,
			itemId,
			userId,
		})

		const result = await this.getById(splitId, true)
		if (!result) {
			throw new NotFoundError('split not found after deleting item')
		}

		return result
	}

	async getMySplits(
		userId: string,
		options: {
			offset?: number
			limit?: number
			status?: 'draft' | 'active' | 'completed'
		} = {},
	): Promise<Split[]> {
		return await this.splitsRepo.findByUser(userId, options)
	}

	async create(userId: string, dto: CreateSplitDto): Promise<SplitResponse> {
		this.logger.info('creating split', { userId, name: dto.name })

		const split = await this.splitsRepo.create(userId, {
			name: dto.name,
			currency: dto.currency,
		})

		if (dto.items?.length) {
			await this.itemsRepo.createMany(split.id, dto.items)
		}

		this.logger.info('split created', {
			splitId: split.id,
			itemsCount: dto.items?.length || 0,
		})

		// calculations not required - it's just created
		const result = await this.getById(split.id, false)

		if (!result) {
			throw new NotFoundError('split was created but not found')
		}

		return result
	}

	async join(splitId: string, userId: string): Promise<SplitResponse> {
		const split = await this.splitsRepo.findById(splitId)
		if (!split) {
			throw new NotFoundError('split not found')
		}

		if (split.maxParticipants) {
			const currentCount = await this.participantsRepo.countParticipants(splitId)
			if (currentCount >= split.maxParticipants) {
				throw new Error('split is full')
			}
		}

		await this.participantsRepo.join(splitId, userId)

		this.logger.info('user joined split', { splitId, userId })

		const result = await this.getById(splitId, false)
		if (!result) {
			throw new NotFoundError('split not found after join')
		}

		return result
	}

	async addItems(
		splitId: string,
		userId: string,
		items: Pick<Item, 'name' | 'price' | 'type' | 'quantity' | 'defaultDivisionMethod'>[],
	): Promise<SplitResponse> {
		const split = await this.splitsRepo.findById(splitId)
		if (!split) {
			throw new NotFoundError('split not found')
		}

		// todo: permissions

		await this.itemsRepo.createMany(splitId, items)

		this.logger.info('items added to split', {
			splitId,
			userId,
			itemsCount: items.length,
		})

		// back with calculations
		const result = await this.getById(splitId, true)
		if (!result) {
			throw new NotFoundError('split not found after adding items')
		}

		return result
	}

	async selectItems(
		splitId: string,
		participantId: string,
		selections: Array<{
			itemId: string
			divisionMethod: 'equal' | 'shares' | 'fixed' | 'proportional' | 'custom'
			value?: string
		}>,
	): Promise<SplitResponse> {
		const split = await this.splitsRepo.findById(splitId)
		if (!split) {
			throw new NotFoundError('split not found')
		}

		// todo: check if participantId is in splitId

		await this.participantsRepo.selectItems(participantId, splitId, selections)

		this.logger.info('participant selected items', {
			splitId,
			participantId,
			selectionsCount: selections.length,
		})

		const [items, participants] = await Promise.all([
			this.itemsRepo.findBySplitId(splitId),
			this.participantsRepo.findBySplitId(splitId),
		])

		const calculated = this.calcService.calculate({
			split,
			items,
			participants,
		})

		const calculatedSums = calculated.calculations.flatMap(calc =>
			calc.items.map(item => ({
				participantId: calc.participantId,
				itemId: item.itemId,
				calculatedSum: item.finalAmount,
			})),
		)

		await this.participantsRepo.updateCalculatedSums(splitId, calculatedSums)

		const response: SplitResponse = { split, items, participants }
		response.calculations = this.buildCalculations(response)

		return response
	}

	async updateSplit(
		splitId: string,
		userId: string,
		data: { name?: string; currency?: string },
	): Promise<SplitResponse> {
		const split = await this.splitsRepo.findById(splitId)
		if (!split) {
			throw new NotFoundError('split not found')
		}

		// todo: permissions check

		await this.splitsRepo.update(splitId, data)

		this.logger.info('split updated', { splitId, userId, changes: data })

		// calculations are not required - we're just edited split info
		const result = await this.getById(splitId, false)
		if (!result) {
			throw new NotFoundError('split not found after update')
		}

		return result
	}

	async getSplitPaymentMethods(splitId: string, userId: string): Promise<PaymentMethod[]> {
		// проверяем что сплит существует
		const split = await this.splitsRepo.findById(splitId)
		if (!split) {
			throw new NotFoundError('split not found')
		}

		// TODO: проверить права доступа (является ли участником)

		const methods = await this.paymentMethodsRepo.findBySplitId(splitId)

		this.logger.debug('fetched split payment methods', {
			splitId,
			userId,
			count: methods.length,
		})

		return methods
	}

	/**
	 * получить свои методы оплаты
	 */
	async getMyPaymentMethods(userId: string): Promise<PaymentMethod[]> {
		return await this.paymentMethodsRepo.findByUserId(userId)
	}

	/**
	 * создать новый метод оплаты
	 */
	async createPaymentMethod(userId: string, dto: CreatePaymentMethodDto): Promise<PaymentMethod> {
		// валидация paymentData
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

	/**
	 * обновить метод оплаты
	 */
	async updatePaymentMethod(
		paymentMethodId: string,
		userId: string,
		dto: UpdatePaymentMethodDto,
	): Promise<PaymentMethod> {
		const paymentMethod = await this.paymentMethodsRepo.findById(paymentMethodId)
		if (!paymentMethod) {
			throw new NotFoundError('payment method not found')
		}

		// проверяем что это метод этого юзера
		if (paymentMethod.userId !== userId) {
			throw new ValidationError('you can only update your own payment methods')
		}

		await this.paymentMethodsRepo.update(paymentMethodId, dto)

		this.logger.info('payment method updated', {
			userId,
			paymentMethodId,
		})

		// возвращаем обновленный
		const updated = await this.paymentMethodsRepo.findById(paymentMethodId)
		if (!updated) {
			throw new NotFoundError('payment method not found after update')
		}

		return updated
	}

	/**
	 * удалить метод оплаты
	 */
	async deletePaymentMethod(paymentMethodId: string, userId: string): Promise<void> {
		const paymentMethod = await this.paymentMethodsRepo.findById(paymentMethodId)
		if (!paymentMethod) {
			throw new NotFoundError('payment method not found')
		}

		// проверяем что это метод этого юзера
		if (paymentMethod.userId !== userId) {
			throw new ValidationError('you can only delete your own payment methods')
		}

		await this.paymentMethodsRepo.delete(paymentMethodId)

		this.logger.info('payment method deleted', {
			userId,
			paymentMethodId,
		})
	}

	/**
	 * добавить метод оплаты к сплиту
	 */
	async addPaymentMethodToSplit(
		splitId: string,
		userId: string,
		dto: AddPaymentMethodToSplitDto,
	): Promise<void> {
		const split = await this.splitsRepo.findById(splitId)
		if (!split) {
			throw new NotFoundError('split not found')
		}

		// только владелец может добавлять методы оплаты
		if (split.ownerId !== userId) {
			throw new ValidationError('only split owner can add payment methods')
		}

		// проверяем что метод существует и принадлежит владельцу
		const paymentMethod = await this.paymentMethodsRepo.findById(dto.paymentMethodId)
		if (!paymentMethod) {
			throw new NotFoundError('payment method not found')
		}

		if (paymentMethod.userId !== userId) {
			throw new ValidationError('you can only add your own payment methods')
		}

		await this.paymentMethodsRepo.addToSplit(
			splitId,
			dto.paymentMethodId,
			dto.isPreferred || false,
		)

		this.logger.info('payment method added to split', {
			splitId,
			userId,
			paymentMethodId: dto.paymentMethodId,
		})
	}

	/**
	 * удалить метод оплаты из сплита
	 */
	async removePaymentMethodFromSplit(
		splitId: string,
		paymentMethodId: string,
		userId: string,
	): Promise<void> {
		const split = await this.splitsRepo.findById(splitId)
		if (!split) {
			throw new NotFoundError('split not found')
		}

		// только владелец может удалять методы оплаты
		if (split.ownerId !== userId) {
			throw new ValidationError('only split owner can remove payment methods')
		}

		await this.paymentMethodsRepo.removeFromSplit(splitId, paymentMethodId)

		this.logger.info('payment method removed from split', {
			splitId,
			userId,
			paymentMethodId,
		})
	}

	/**
	 * валидация данных оплаты в зависимости от типа
	 */
	private validatePaymentData(type: string, paymentData: unknown): void {
		// проверяем что это объект
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
				// эти типы не требуют специфичной валидации
				break

			default:
				throw new ValidationError(`unknown payment method type: ${type}`)
		}
	}

	async getMyParticipation(
		splitId: string,
		userId: string,
	): Promise<{ participant: Participant; calculation?: unknown } | null> {
		const participant = await this.participantsRepo.findByUserAndSplit(userId, splitId)
		if (!participant) return null

		const split = await this.getById(splitId, true)
		if (!split || !split.calculations) return { participant }

		const calc = split.calculations.participants.find(p => p.participantId === participant.id)

		return {
			participant,
			calculation: calc,
		}
	}

	async getUserStats(userId: string) {
		return await this.statsRepo.getUserStats(userId)
	}

	private buildCalculations(data: SplitData): Calculations {
		const calculated = this.calcService.calculate(data)

		return {
			participants: calculated.calculations.map(calc => {
				// items array to Record<itemId, result>
				const items = calc.items.reduce(
					(acc, item) => {
						acc[item.itemId] = {
							baseAmount: item.baseAmount,
							discountAmount: item.discountAmount,
							finalAmount: item.finalAmount,
							divisionMethod: item.divisionMethod,
							participationValue: item.participationValue,
						}
						return acc
					},
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					{} as any,
				)

				const result: ParticipantCalculationData = {
					participantId: calc.participantId,
					totalBaseAmount: calc.totalBaseAmount,
					totalDiscountAmount: calc.totalDiscountAmount,
					totalAmount: calc.totalAmount,
					items,
				}

				return result
			}),
			totals: {
				splitAmount: calculated.totalSplitAmount,
				collected: calculated.totalCollected,
				difference: calculated.difference,
			},
		}
	}
}
