import { ForbiddenError, NotFoundError, ValidationError } from '@/common/errors'
import type {
	AddPaymentMethodToSplitDto,
	Calculations,
	CreateSplitDto,
	Item,
	Participant,
	ParticipantCalculationData,
	PaymentMethods,
	Split,
	SplitData,
	SplitResponse,
	SplitsByPeriod,
} from '@/common/types'
import type { Cache } from '@/platform/cache'
import type { Logger } from '@/platform/logger'
import type { ContactsRepository } from '@/repositories/contacts'
import type { ItemsRepository } from '@/repositories/items'
import type { ParticipantsRepository } from '@/repositories/participants'
import type { PaymentMethodsRepository } from '@/repositories/payment-methods'
import type { SplitsRepository } from '@/repositories/splits'
import type { StatsRepository } from '@/repositories/stats'
import { CalculationService } from '@/services/calculation'

export class SplitsService {
	constructor(
		private splitsRepo: SplitsRepository,
		private itemsRepo: ItemsRepository,
		private participantsRepo: ParticipantsRepository,
		private paymentMethodsRepo: PaymentMethodsRepository,
		private statsRepo: StatsRepository,
		private contactsRepo: ContactsRepository,
		private calcService: CalculationService,
		private logger: Logger,
		private cache: Cache,
	) {}

	private async fetchSplitWithRelations(
		split: Split | null,
		includeCalculations: boolean,
	): Promise<SplitResponse | null> {
		if (!split) return null

		const [items, participants] = await Promise.all([
			this.itemsRepo.findBySplitId(split.id),
			this.participantsRepo.findBySplitId(split.id),
		])

		const response: SplitResponse = { split, items, participants }

		if (includeCalculations) {
			response.calculations = this.buildCalculations(response)
		}

		return response
	}

	async getById(rawId: string, includeCalculations = true): Promise<SplitResponse | null> {
		this.logger.debug('fetching split', { id: rawId })

		const split = await this.splitsRepo.findById(rawId)
		return this.fetchSplitWithRelations(split, includeCalculations)
	}

	async getByShortId(shortId: string, includeCalculations = true): Promise<SplitResponse | null> {
		this.logger.debug('fetching split', { shortId })

		const split = await this.splitsRepo.findByShortId(shortId)
		return this.fetchSplitWithRelations(split, includeCalculations)
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
			throw new NotFoundError('Split not found')
		}

		if (split.ownerId !== userId) {
			throw new ForbiddenError('Only split owner can update items')
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
			throw new NotFoundError('Split not found after updating item')
		}

		return result
	}

	async deleteItem(splitId: string, itemId: string, userId: string): Promise<SplitResponse | null> {
		const split = await this.splitsRepo.findById(splitId)
		if (!split) {
			throw new NotFoundError('Split not found')
		}

		if (split.ownerId !== userId) {
			throw new ForbiddenError('Only split owner can delete items')
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
			throw new NotFoundError('Split not found after deleting item')
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

		const result = await this.getById(split.id, false)

		if (!result) {
			throw new NotFoundError('Split was created but not found')
		}

		return result
	}

	async createOrUpdate(userId: string, dto: CreateSplitDto & { id?: string }): Promise<SplitResponse> {
		if (dto.id) {
			const existing = await this.splitsRepo.findById(dto.id)
			if (!existing) {
				throw new NotFoundError('Split not found')
			}

			if (existing.ownerId !== userId) {
				throw new ForbiddenError('Only owner can update split')
			}

			if (existing.status !== 'draft') {
				throw new ForbiddenError('Can only update draft splits')
			}

			await this.splitsRepo.update(dto.id, {
				name: dto.name,
				currency: dto.currency,
			})

			if (dto.items) {
				const currentItems = await this.itemsRepo.findBySplitId(dto.id)

				const itemsToUpdate = dto.items.filter(item => item.id)
				const itemsToCreate = dto.items.filter(item => !item.id)

				for (const item of itemsToUpdate) {
					await this.itemsRepo.update(item.id!, dto.id, {
						name: item.name,
						price: item.price,
						quantity: item.quantity,
						type: item.type,
						defaultDivisionMethod: item.defaultDivisionMethod,
					})
				}

				if (itemsToCreate.length > 0) {
					await this.itemsRepo.createMany(dto.id, itemsToCreate)
				}

				const updatedItemIds = new Set(dto.items.filter(i => i.id).map(i => i.id))
				const itemsToDelete = currentItems.filter(item => !updatedItemIds.has(item.id))

				for (const item of itemsToDelete) {
					await this.itemsRepo.softDelete(item.id, dto.id)
				}
			}

			const result = await this.getById(dto.id, false)
			if (!result) {
				throw new NotFoundError('Split not found after update')
			}

			return result
		}

		return await this.create(userId, dto)
	}

	async publishDraft(splitId: string, userId: string): Promise<SplitResponse> {
		const split = await this.splitsRepo.findById(splitId)
		if (!split) {
			throw new NotFoundError('Split not found')
		}

		if (split.ownerId !== userId) {
			throw new ForbiddenError('Only owner can publish split')
		}

		if (split.status !== 'draft') {
			throw new ValidationError('Split is already published')
		}

		const items = await this.itemsRepo.findBySplitId(splitId)
		if (items.length === 0) {
			throw new ValidationError('Cannot publish split without items')
		}

		// change status to active
		await this.splitsRepo.update(splitId, {
			status: 'active',
			phase: 'voting', // participants can now select their items
		})

		this.logger.info('split published', { splitId, userId })

		const result = await this.getById(splitId, true)
		if (!result) {
			throw new NotFoundError('Split not found after publishing')
		}

		return result
	}

	async join(
		splitId: string,
		userId: string,
		displayName?: string,
		isAnonymous: boolean = false,
	): Promise<SplitResponse> {
		const split = await this.splitsRepo.findById(splitId)
		if (!split) {
			throw new NotFoundError('Split not found')
		}

		if (split.maxParticipants) {
			const currentCount = await this.participantsRepo.countParticipants(splitId)
			if (currentCount >= split.maxParticipants) {
				throw new Error('Split is full')
			}
		}

		await this.participantsRepo.join(splitId, userId, displayName, isAnonymous)

		await this.contactsRepo.invalidateUserContacts(userId)

		await this.contactsRepo.invalidateUserContacts(split.ownerId)

		await this.cache.deletePattern(`split:${splitId}:participants`)

		const participants = await this.participantsRepo.findBySplitId(splitId)

		await Promise.all(
			participants
				.filter(p => p.userId && p.userId !== userId && p.userId !== split.ownerId)
				.map(p => this.contactsRepo.invalidateUserContacts(p.userId!)),
		)

		this.logger.info('user joined split', { splitId, userId, isAnonymous, displayName })

		const result = await this.getById(splitId, false)
		if (!result) {
			throw new NotFoundError('Split not found after join')
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
			throw new NotFoundError('Split not found')
		}

		await this.itemsRepo.createMany(splitId, items)

		this.logger.info('items added to split', {
			splitId,
			userId,
			itemsCount: items.length,
		})

		const result = await this.getById(splitId, true)
		if (!result) {
			throw new NotFoundError('Split not found after adding items')
		}

		return result
	}

	async replaceItems(
		splitId: string,
		userId: string,
		items: Array<Pick<Item, 'name' | 'price' | 'type' | 'quantity' | 'defaultDivisionMethod'>>,
	): Promise<SplitResponse> {
		const split = await this.splitsRepo.findById(splitId)
		if (!split) {
			throw new NotFoundError('Split not found')
		}

		if (split.ownerId !== userId) {
			throw new ForbiddenError('Only owner can replace items')
		}

		if (split.status !== 'draft') {
			throw new ForbiddenError('Can only replace items in draft splits')
		}

		// delete all existing items
		const currentItems = await this.itemsRepo.findBySplitId(splitId)
		for (const item of currentItems) {
			await this.itemsRepo.softDelete(item.id, splitId)
		}

		// create new items
		if (items.length > 0) {
			await this.itemsRepo.createMany(splitId, items)
		}

		this.logger.info('items replaced in split', {
			splitId,
			userId,
			oldCount: currentItems.length,
			newCount: items.length,
		})

		const result = await this.getById(splitId, true)
		if (!result) {
			throw new NotFoundError('Split not found after replacing items')
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
			throw new NotFoundError('Split not found')
		}

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
			throw new NotFoundError('Split not found')
		}

		await this.splitsRepo.update(splitId, data)

		this.logger.info('split updated', { splitId, userId, changes: data })

		const result = await this.getById(splitId, false)
		if (!result) {
			throw new NotFoundError('Split not found after update')
		}

		return result
	}

	async getSplitPaymentMethods(splitId: string, userId: string): Promise<PaymentMethods[]> {
		const split = await this.splitsRepo.findById(splitId)
		if (!split) {
			throw new NotFoundError('Split not found')
		}

		const methods = await this.paymentMethodsRepo.findBySplitId(splitId)

		this.logger.debug('fetched split payment methods', {
			splitId,
			userId,
			count: methods.length,
		})

		return methods
	}

	async addPaymentMethodToSplit(splitId: string, userId: string, dto: AddPaymentMethodToSplitDto): Promise<void> {
		const split = await this.splitsRepo.findById(splitId)
		if (!split) {
			throw new NotFoundError('Split not found')
		}

		if (split.ownerId !== userId) {
			throw new ValidationError('Only split owner can add payment methods')
		}

		const paymentMethod = await this.paymentMethodsRepo.findById(dto.paymentMethodId)
		if (!paymentMethod) {
			throw new NotFoundError('Payment method not found')
		}

		if (paymentMethod.userId !== userId) {
			throw new ValidationError('You can only add your own payment methods')
		}

		await this.paymentMethodsRepo.addToSplit(splitId, dto.paymentMethodId, dto.isPreferred || false)

		this.logger.info('payment method added to split', {
			splitId,
			userId,
			paymentMethodId: dto.paymentMethodId,
		})
	}

	async removePaymentMethodFromSplit(splitId: string, paymentMethodId: string, userId: string): Promise<void> {
		const split = await this.splitsRepo.findById(splitId)
		if (!split) {
			throw new NotFoundError('Split not found')
		}

		if (split.ownerId !== userId) {
			throw new ValidationError('Only split owner can remove payment methods')
		}

		await this.paymentMethodsRepo.removeFromSplit(splitId, paymentMethodId)

		this.logger.info('payment method removed from split', {
			splitId,
			userId,
			paymentMethodId,
		})
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

	async getDraft(userId: string): Promise<SplitResponse | null> {
		const split = await this.splitsRepo.findDraftByUser(userId)
		if (!split) return null

		const [items, participants] = await Promise.all([
			this.itemsRepo.findBySplitId(split.id),
			this.participantsRepo.findBySplitId(split.id),
		])

		return { split, items, participants }
	}

	private buildCalculations(data: SplitData): Calculations {
		const calculated = this.calcService.calculate(data)

		return {
			participants: calculated.calculations.map(calc => {
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
