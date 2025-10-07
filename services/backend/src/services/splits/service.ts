import { NotFoundError } from '@/common/errors'
import type {
	Calculations,
	CreateSplitDto,
	Item,
	ParticipantCalculationData,
	SplitData,
	SplitResponse,
} from '@/common/types'
import type { Logger } from '@/platform/logger'
import type { ItemsRepository } from '@/repositories/items'
import type { ParticipantsRepository } from '@/repositories/participants'
import type { SplitsRepository } from '@/repositories/splits'
import { CalculationService } from '@/services/calculation'

export class SplitsService {
	constructor(
		private splitsRepo: SplitsRepository,
		private itemsRepo: ItemsRepository,
		private participantsRepo: ParticipantsRepository,
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

	async addItems(
		splitId: string,
		userId: string,
		items: Array<{ name: string; price: number; type: Item['type']; quantity: string | null }>,
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

		// back with calculations - they're changed
		const result = await this.getById(splitId, true)
		if (!result) {
			throw new NotFoundError('split not found after selecting items')
		}

		return result
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
