import { NotFoundError, ForbiddenError } from '@/common/errors'
import type {
	Calculations,
	CreateSplitDto,
	Item,
	Participant,
	ParticipantCalculationData,
	Split,
	SplitData,
	SplitResponse,
} from '@/common/types'
import type { Logger } from '@/platform/logger'
import type { ItemsRepository } from '@/repositories/items'
import type { ParticipantsRepository } from '@/repositories/participants'
import type { SplitsRepository } from '@/repositories/splits'
import type { StatsRepository } from '@/repositories/stats'
import { CalculationService } from '@/services/calculation'

export class SplitsService {
	constructor(
		private splitsRepo: SplitsRepository,
		private itemsRepo: ItemsRepository,
		private participantsRepo: ParticipantsRepository,
		private statsRepo: StatsRepository,
		private calcService: CalculationService,
		private logger: Logger,
	) {}

	async getById(splitId: string, includeCalculations = true, viewerId?: string): Promise<SplitResponse | null> {
		this.logger.debug('fetching split', { splitId })

		const [split, items, participants] = await Promise.all([
			this.splitsRepo.findById(splitId),
			this.itemsRepo.findBySplitId(splitId),
			this.participantsRepo.findBySplitId(splitId, viewerId),
		])

		if (!split) return null

		const response: SplitResponse = { split, items, participants }

		if (includeCalculations) {
			response.calculations = this.buildCalculations(response, viewerId)
		}

		return response
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

	async getMySplits(userId: string, offset: number = 0, limit: number = 50): Promise<Split[]> {
		return await this.splitsRepo.findByUser(userId, offset, limit)
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

	async join(
		splitId: string,
		userId: string,
		options?: {
			displayName?: string
			anonymous?: boolean
		},
	): Promise<SplitResponse> {
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

		await this.participantsRepo.join(splitId, userId, options)

		this.logger.info('user joined split', { splitId, userId, anonymous: options?.anonymous ?? false })

		const result = await this.getById(splitId, false, userId)
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
		userId: string,
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
			userId,
			selectionsCount: selections.length,
		})

		const [items, participants] = await Promise.all([
			this.itemsRepo.findBySplitId(splitId),
			this.participantsRepo.findBySplitId(splitId, userId),
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
		response.calculations = this.buildCalculations(response, userId)

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

	async getMyParticipation(
		splitId: string,
		userId: string,
	): Promise<{ participant: Participant; calculation?: unknown } | null> {
		const participant = await this.participantsRepo.findByUserAndSplit(userId, splitId)
		if (!participant) return null

		const split = await this.getById(splitId, true, userId)
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

	private buildCalculations(data: SplitData, viewerId?: string): Calculations {
		const calculated = this.calcService.calculate(data)

		return {
			participants: calculated.calculations.map(calc => {
				const participant = data.participants.find(p => p.id === calc.participantId)

				const shouldAnonymize = participant?.anonymous && participant?.userId !== viewerId

				const displayName = shouldAnonymize ? (participant.displayName ?? 'Аноним') : calc.displayName

				return {
					participantId: calc.participantId,
					displayName,
					totalBaseAmount: calc.totalBaseAmount,
					totalDiscountAmount: calc.totalDiscountAmount,
					totalAmount: calc.totalAmount,
					items: calc.items.reduce((acc, item) => {
						acc[item.itemId] = {
							baseAmount: item.baseAmount,
							discountAmount: item.discountAmount,
							finalAmount: item.finalAmount,
							divisionMethod: item.divisionMethod,
							participationValue: item.participationValue,
						}
						return acc
					}, {} as any),
				}
			}),
			totals: {
				splitAmount: calculated.totalSplitAmount,
				collected: calculated.totalCollected,
				difference: calculated.difference,
			},
		}
	}
}
