import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/common/errors'
import type {
	AddPaymentMethodToSplitDto,
	CreateSplitDto,
	Item,
	Participant,
	ParticipantCalculation,
	PaymentMethod,
	Split,
	SplitCalculations,
	SplitData,
	SplitResponse,
	SplitsByPeriod,
} from '@/common/types'
import type { Logger } from '@/platform/logger'
import type {
	ContactsRepository,
	ItemsRepository,
	ParticipantsRepository,
	PaymentMethodsRepository,
	ReceiptsRepository,
	SplitsRepository,
	StatsRepository,
} from '@/repositories'
import type { CalculationService } from '@/services/calculation'

export class SplitsService {
	constructor(
		private readonly splits: SplitsRepository,
		private readonly items: ItemsRepository,
		private readonly participants: ParticipantsRepository,
		private readonly paymentMethods: PaymentMethodsRepository,
		private readonly stats: StatsRepository,
		private readonly contacts: ContactsRepository,
		private readonly receipts: ReceiptsRepository,
		private readonly calc: CalculationService,
		private readonly logger: Logger,
	) {}

	async getById(id: string, includeCalculations = true): Promise<SplitResponse | null> {
		const split = await this.splits.findById(id)
		return this.buildResponse(split, includeCalculations)
	}

	async getByShortId(shortId: string, includeCalculations = true): Promise<SplitResponse | null> {
		const split = await this.splits.findByShortId(shortId)
		return this.buildResponse(split, includeCalculations)
	}

	async getMySplitsGrouped(userId: string): Promise<SplitsByPeriod> {
		return this.splits.findByUserGroupedByPeriod(userId)
	}

	async getMySplits(
		userId: string,
		options: { offset?: number; limit?: number; status?: Split['status'] } = {},
	): Promise<Split[]> {
		return this.splits.findByUser(userId, options)
	}

	async getEarlierSplits(userId: string, offset: number = 0, limit: number = 20): Promise<Split[]> {
		const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
		return this.splits.findByUser(userId, { offset, limit, before: startOfMonth })
	}

	async getDraft(userId: string): Promise<SplitResponse | null> {
		const split = await this.splits.findDraftByUser(userId)
		return this.buildResponse(split, false)
	}

	async create(userId: string, dto: CreateSplitDto): Promise<SplitResponse> {
		this.logger.info('creating split', { userId, name: dto.name })

		const split = await this.splits.create(userId, { name: dto.name, currency: dto.currency })

		if (dto.items?.length) {
			await this.items.createMany(split.id, dto.items)
		}

		if (dto.receiptIds?.length) {
			for (const receiptId of dto.receiptIds) {
				await this.splits.linkReceipt(split.id, receiptId)
			}
			await this.importItemsFromReceipts(split.id, dto.receiptIds)
		}

		this.logger.info('split created', { splitId: split.id })
		return (await this.getById(split.id, false))!
	}

	async createOrUpdate(userId: string, dto: CreateSplitDto & { id?: string }): Promise<SplitResponse> {
		if (!dto.id) return this.create(userId, dto)

		const existing = await this.splits.findById(dto.id)
		if (!existing) throw new NotFoundError('split not found')
		if (existing.ownerId !== userId) throw new ForbiddenError('only owner can update split')
		if (existing.status !== 'draft') throw new ForbiddenError('can only update draft splits')

		await this.splits.update(dto.id, { name: dto.name, currency: dto.currency })

		if (dto.items) {
			const currentItems = await this.items.findBySplitId(dto.id)
			const toUpdate = dto.items.filter(i => i.id)
			const toCreate = dto.items.filter(i => !i.id)

			for (const item of toUpdate) {
				await this.items.update(item.id!, dto.id, {
					name: item.name,
					price: item.price,
					quantity: item.quantity,
					type: item.type,
					defaultDivisionMethod: item.defaultDivisionMethod,
				})
			}

			if (toCreate.length > 0) {
				await this.items.createMany(dto.id, toCreate)
			}

			const updatedIds = new Set(toUpdate.map(i => i.id))
			for (const item of currentItems.filter(i => !updatedIds.has(i.id))) {
				await this.items.softDelete(item.id, dto.id)
			}
		}

		return (await this.getById(dto.id, false))!
	}

	async publish(splitId: string, userId: string): Promise<SplitResponse> {
		const split = await this.splits.findById(splitId)
		if (!split) throw new NotFoundError('split not found')
		if (split.ownerId !== userId) throw new ForbiddenError('only owner can publish split')
		if (split.status !== 'draft') throw new ValidationError('split is already published')

		const items = await this.items.findBySplitId(splitId)
		if (items.length === 0) throw new ValidationError('cannot publish split without items')

		await this.splits.update(splitId, { status: 'active', phase: 'voting' })
		this.logger.info('split published', { splitId, userId })

		return (await this.getById(splitId, true))!
	}

	async join(
		splitId: string,
		userId: string,
		displayName?: string,
		isAnonymous: boolean = false,
	): Promise<SplitResponse> {
		const split = await this.splits.findById(splitId)
		if (!split) throw new NotFoundError('split not found')

		if (split.maxParticipants) {
			const count = await this.participants.countParticipants(splitId)
			if (count >= split.maxParticipants) throw new ConflictError('split is full')
		}

		await this.participants.join(splitId, userId, displayName, isAnonymous)
		await this.contacts.invalidateUserContacts(userId)
		await this.contacts.invalidateUserContacts(split.ownerId)

		this.logger.info('user joined split', { splitId, userId, isAnonymous })
		return (await this.getById(splitId, false))!
	}

	async addItems(
		splitId: string,
		userId: string,
		items: Pick<Item, 'name' | 'price' | 'type' | 'quantity' | 'defaultDivisionMethod'>[],
	): Promise<SplitResponse> {
		const split = await this.splits.findById(splitId)
		if (!split) throw new NotFoundError('split not found')

		await this.items.createMany(splitId, items)
		this.logger.info('items added', { splitId, count: items.length })

		return (await this.getById(splitId, true))!
	}

	async updateItem(splitId: string, itemId: string, userId: string, data: Partial<Item>): Promise<SplitResponse> {
		const split = await this.splits.findById(splitId)
		if (!split) throw new NotFoundError('split not found')
		if (split.ownerId !== userId) throw new ForbiddenError('only owner can update items')

		const item = await this.items.findById(itemId)
		if (!item || item.splitId !== splitId) throw new NotFoundError('item not found')

		await this.items.update(itemId, splitId, data)
		return (await this.getById(splitId, true))!
	}

	async deleteItem(splitId: string, itemId: string, userId: string): Promise<SplitResponse> {
		const split = await this.splits.findById(splitId)
		if (!split) throw new NotFoundError('split not found')
		if (split.ownerId !== userId) throw new ForbiddenError('only owner can delete items')

		const item = await this.items.findById(itemId)
		if (!item || item.splitId !== splitId) throw new NotFoundError('item not found')

		await this.items.softDelete(itemId, splitId)
		return (await this.getById(splitId, true))!
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
		const split = await this.splits.findById(splitId)
		if (!split) throw new NotFoundError('split not found')

		await this.participants.selectItems(participantId, splitId, selections)

		const [items, participants] = await Promise.all([
			this.items.findBySplitId(splitId),
			this.participants.findBySplitId(splitId),
		])

		const calculated = this.calc.calculate({ split, items, participants })

		await this.participants.updateCalculations(
			splitId,
			calculated.itemResults.map(r => ({
				participantId: r.participantId,
				itemId: r.itemId,
				calculatedBase: r.baseAmount,
				calculatedDiscount: r.discountAmount,
				calculatedSum: r.finalAmount,
			})),
		)

		for (const pt of calculated.participantTotals) {
			await this.participants.updateParticipantTotal(pt.participantId, splitId, pt.totalFinal)
		}

		await this.splits.update(splitId, {
			cachedTotal: calculated.splitTotal,
			cachedCollected: calculated.collected,
			calculatedAt: new Date(),
		})

		return (await this.getById(splitId, true))!
	}

	async getMyParticipation(
		splitId: string,
		userId: string,
	): Promise<{ participant: Participant; calculation?: unknown } | null> {
		const participant = await this.participants.findByUserAndSplit(userId, splitId)
		if (!participant) return null

		const response = await this.getById(splitId, true)
		const calc = response?.calculations?.participants.find(p => p.participantId === participant.id)

		return { participant, calculation: calc }
	}

	async getSplitPaymentMethods(splitId: string): Promise<PaymentMethod[]> {
		const split = await this.splits.findById(splitId)
		if (!split) throw new NotFoundError('split not found')
		return this.paymentMethods.findBySplitId(splitId)
	}

	async addPaymentMethod(splitId: string, userId: string, dto: AddPaymentMethodToSplitDto): Promise<void> {
		const split = await this.splits.findById(splitId)
		if (!split) throw new NotFoundError('split not found')
		if (split.ownerId !== userId) throw new ForbiddenError('only owner can add payment methods')

		const pm = await this.paymentMethods.findById(dto.paymentMethodId)
		if (!pm) throw new NotFoundError('payment method not found')
		if (pm.userId !== userId) throw new ForbiddenError('can only add own payment methods')

		await this.paymentMethods.addToSplit(splitId, dto.paymentMethodId, dto.isPreferred)
	}

	async removePaymentMethod(splitId: string, paymentMethodId: string, userId: string): Promise<void> {
		const split = await this.splits.findById(splitId)
		if (!split) throw new NotFoundError('split not found')
		if (split.ownerId !== userId) throw new ForbiddenError('only owner can remove payment methods')

		await this.paymentMethods.removeFromSplit(splitId, paymentMethodId)
	}

	async getUserStats(userId: string) {
		return this.stats.getUserStats(userId)
	}

	async linkReceipt(splitId: string, receiptId: string, userId: string): Promise<SplitResponse> {
		const split = await this.splits.findById(splitId)
		if (!split) throw new NotFoundError('split not found')
		if (split.ownerId !== userId) throw new ForbiddenError('only owner can link receipts')

		await this.splits.linkReceipt(splitId, receiptId)
		await this.importItemsFromReceipts(splitId, [receiptId])

		return (await this.getById(splitId, true))!
	}

	async unlinkReceipt(splitId: string, receiptId: string, userId: string): Promise<SplitResponse> {
		const split = await this.splits.findById(splitId)
		if (!split) throw new NotFoundError('split not found')
		if (split.ownerId !== userId) throw new ForbiddenError('only owner can unlink receipts')

		await this.splits.unlinkReceipt(splitId, receiptId)
		return (await this.getById(splitId, true))!
	}

	private async buildResponse(split: Split | null, includeCalculations: boolean): Promise<SplitResponse | null> {
		if (!split) return null

		const [items, participants, receiptIds] = await Promise.all([
			this.items.findBySplitId(split.id),
			this.participants.findBySplitId(split.id),
			this.splits.getReceiptIds(split.id),
		])

		const response: SplitResponse = { split, items, participants }

		if (receiptIds.length > 0) {
			const receipts = await this.receipts.findByIds(receiptIds)
			response.receipts = receipts.map(r => ({
				id: r.id,
				placeName: r.placeName,
				total: r.total,
				createdAt: r.createdAt,
			}))
		}

		if (includeCalculations) {
			response.calculations = this.buildCalculations({ split, items, participants })
		}

		return response
	}

	private buildCalculations(data: SplitData): SplitCalculations {
		const result = this.calc.calculate(data)

		const participants: ParticipantCalculation[] = result.participantTotals.map(pt => {
			const participant = data.participants.find(p => p.id === pt.participantId)
			const items: ParticipantCalculation['items'] = {}

			for (const ir of result.itemResults.filter(r => r.participantId === pt.participantId)) {
				items[ir.itemId] = {
					baseAmount: ir.baseAmount,
					discountAmount: ir.discountAmount,
					finalAmount: ir.finalAmount,
					divisionMethod: ir.divisionMethod,
					participationValue: ir.participationValue,
				}
			}

			return {
				participantId: pt.participantId,
				displayName: participant?.displayName || participant?.user?.displayName || 'unknown',
				totalBase: pt.totalBase,
				totalDiscount: pt.totalDiscount,
				totalFinal: pt.totalFinal,
				items,
			}
		})

		return {
			participants,
			totals: {
				splitAmount: result.splitTotal,
				collected: result.collected,
				difference: result.difference,
			},
		}
	}

	private async importItemsFromReceipts(splitId: string, receiptIds: string[]): Promise<void> {
		for (const receiptId of receiptIds) {
			const receiptItems = await this.receipts.getItems(receiptId)

			const newItems = receiptItems.map(ri => ({
				name: ri.name || ri.rawName,
				price: ri.sum,
				type: 'product' as const,
				quantity: ri.quantity,
				defaultDivisionMethod: (ri.suggestedSplitMethod as any) || 'equal',
				receiptItemId: ri.id,
				icon: ri.emoji || undefined,
			}))

			if (newItems.length > 0) {
				await this.items.createMany(splitId, newItems)
			}
		}
	}
}
