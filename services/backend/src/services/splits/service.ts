import type { SplitResponseDto } from '@chopcheck/shared'

import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/common/errors'
import type {
	AddPaymentMethodToSplitDto,
	CreateItemGroupDto,
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
	UpdateItemGroupDto,
} from '@/common/types'
import { toItemGroupDto, toParticipantDto, toSplitDto, toSplitItemDto } from '@/http/utils/mappers'
import type { DivisionMethod } from '@/platform/database/schema/enums'
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
import type { ItemGroupsRepository } from '@/repositories/item-groups'
import type { CalculationService } from '@/services/calculation'

export class SplitsService {
	constructor(
		private readonly splits: SplitsRepository,
		private readonly items: ItemsRepository,
		private readonly itemGroups: ItemGroupsRepository,
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

		const split = await this.splits.create(userId, {
			name: dto.name,
			currency: dto.currency,
			icon: dto.icon,
		})

		if (dto.items?.length) {
			await this.items.createMany(split.id, dto.items)
		}

		if (dto.receiptIds?.length) {
			for (const receiptId of dto.receiptIds) {
				await this.splits.linkReceipt(split.id, receiptId)
			}
			for (const receiptId of dto.receiptIds) {
				await this.importItemsFromReceipt(split.id, receiptId)
			}
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

		await this.splits.update(dto.id, {
			name: dto.name,
			currency: dto.currency,
			icon: dto.icon,
		})

		// Only update items if items array is explicitly provided (not null/undefined)
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
					icon: item.icon,
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
		_userId: string,
		items: Array<
			Pick<Item, 'name' | 'price' | 'type' | 'quantity' | 'defaultDivisionMethod'> & {
				icon?: string | null
				groupId?: string | null
			}
		>,
	): Promise<SplitResponse> {
		const split = await this.splits.findById(splitId)
		if (!split) throw new NotFoundError('split not found')

		const itemsToCreate = items.map(item => ({
			name: item.name,
			price: item.price,
			type: item.type,
			quantity: item.quantity,
			defaultDivisionMethod: item.defaultDivisionMethod,
			icon: item.icon ?? undefined,
			groupId: item.groupId ?? undefined,
		}))

		await this.items.createMany(splitId, itemsToCreate)
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
			divisionMethod: DivisionMethod
			value?: string
		}>,
	): Promise<SplitResponse> {
		const split = await this.splits.findById(splitId)
		if (!split) throw new NotFoundError('split not found')

		await this.participants.selectItems(participantId, splitId, selections)

		const [items, itemGroups, participants] = await Promise.all([
			this.items.findBySplitId(splitId),
			this.itemGroups.findBySplitId(splitId),
			this.participants.findBySplitId(splitId),
		])

		const calculated = this.calc.calculate({ split, items, itemGroups, participants })

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
		await this.importItemsFromReceipt(splitId, receiptId)

		return (await this.getById(splitId, true))!
	}

	async unlinkReceipt(splitId: string, receiptId: string, userId: string): Promise<SplitResponse> {
		const split = await this.splits.findById(splitId)
		if (!split) throw new NotFoundError('split not found')
		if (split.ownerId !== userId) throw new ForbiddenError('only owner can unlink receipts')

		await this.splits.unlinkReceipt(splitId, receiptId)
		return (await this.getById(splitId, true))!
	}

	async createItemGroup(splitId: string, userId: string, dto: CreateItemGroupDto): Promise<SplitResponse> {
		const split = await this.splits.findById(splitId)
		if (!split) throw new NotFoundError('split not found')
		if (split.ownerId !== userId) throw new ForbiddenError('only owner can create groups')

		await this.itemGroups.create(splitId, dto)
		this.logger.info('item group created', { splitId })

		return (await this.getById(splitId, false))!
	}

	async updateItemGroup(
		splitId: string,
		groupId: string,
		userId: string,
		dto: UpdateItemGroupDto,
	): Promise<SplitResponse> {
		const split = await this.splits.findById(splitId)
		if (!split) throw new NotFoundError('split not found')
		if (split.ownerId !== userId) throw new ForbiddenError('only owner can update groups')

		const group = await this.itemGroups.findById(groupId)
		if (!group || group.splitId !== splitId) throw new NotFoundError('group not found')

		await this.itemGroups.update(groupId, splitId, dto)
		this.logger.info('item group updated', { splitId, groupId })

		return (await this.getById(splitId, false))!
	}

	async deleteItemGroup(splitId: string, groupId: string, userId: string): Promise<SplitResponse> {
		const split = await this.splits.findById(splitId)
		if (!split) throw new NotFoundError('split not found')
		if (split.ownerId !== userId) throw new ForbiddenError('only owner can delete groups')

		const group = await this.itemGroups.findById(groupId)
		if (!group || group.splitId !== splitId) throw new NotFoundError('group not found')

		await this.items.deleteAllInGroup(splitId, groupId)
		await this.itemGroups.softDelete(groupId, splitId)
		this.logger.info('item group deleted', { splitId, groupId })

		return (await this.getById(splitId, false))!
	}

	private async buildResponse(split: Split | null, includeCalculations: boolean): Promise<SplitResponseDto | null> {
		if (!split) return null

		const [items, itemGroups, participants, receiptIds] = await Promise.all([
			this.items.findBySplitId(split.id),
			this.itemGroups.findBySplitId(split.id),
			this.participants.findBySplitId(split.id),
			this.splits.getReceiptIds(split.id),
		])

		const response: SplitResponseDto = {
			split: toSplitDto(split),
			items: items.map(toSplitItemDto),
			itemGroups: itemGroups.map(toItemGroupDto),
			participants: participants.map(toParticipantDto),
		}

		if (receiptIds.length > 0) {
			const receipts = await this.receipts.findByIds(receiptIds)
			response.receipts = receipts.map(r => ({
				id: r.id,
				placeName: r.placeName || undefined,
				total: r.total,
				createdAt: r.createdAt.toISOString(),
			}))
		}

		if (includeCalculations) {
			response.calculations = this.buildCalculations({ split, items, itemGroups, participants })
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

	private async importItemsFromReceipt(splitId: string, receiptId: string): Promise<void> {
		const receipt = await this.receipts.findById(receiptId)
		if (!receipt) return

		const generalWarnings =
			(receipt.enrichmentData as any)?.warnings?.filter(
				(w: any) => w.itemIndex === undefined || w.itemIndex === null,
			) || []

		const group = await this.itemGroups.create(splitId, {
			name: receipt.placeName || 'Receipt',
			type: 'receipt',
			icon: '🧾',
			receiptId,
			...(generalWarnings.length > 0 && { warnings: generalWarnings }),
		})

		const receiptItems = await this.receipts.getItems(receiptId)

		const newItems = receiptItems.map(ri => ({
			name: ri.name || ri.rawName,
			price: ri.price,
			type: 'product' as const,
			quantity: ri.quantity,
			defaultDivisionMethod: (ri.suggestedSplitMethod as DivisionMethod) || 'by_fraction',
			receiptItemId: ri.id,
			icon: ri.emoji || undefined,
			warnings: ri.warnings,
		}))

		if (newItems.length > 0) {
			await this.items.createMany(splitId, newItems, group.id)
		}
	}
}
