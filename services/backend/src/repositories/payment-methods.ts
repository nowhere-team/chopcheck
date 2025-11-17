import { and, eq } from 'drizzle-orm'

import type { PaymentMethods, SplitPaymentMethod } from '@/common/types'
import { schema } from '@/platform/database'

import { BaseRepository } from './base'

type CreatePaymentMethodData = Pick<
	PaymentMethods,
	'userId' | 'type' | 'displayName' | 'currency' | 'paymentData' | 'isTemporary' | 'isDefault'
>
type UpdatePaymentMethodData = Partial<Pick<PaymentMethods, 'displayName' | 'isDefault' | 'displayOrder'>>

export class PaymentMethodsRepository extends BaseRepository {
	private getCacheKey(id: string): string {
		return `payment_method:${id}`
	}

	private getUserCacheKey(userId: string): string {
		return `user:${userId}:payment_methods`
	}

	private getSplitCacheKey(splitId: string): string {
		return `split:${splitId}:payment_methods`
	}

	async findById(id: string): Promise<PaymentMethods | null> {
		return this.getOrSet(this.getCacheKey(id), async () => {
			const paymentMethod = await this.db.query.userPaymentMethods.findFirst({
				where: and(eq(schema.userPaymentMethods.id, id), eq(schema.userPaymentMethods.isDeleted, false)),
			})

			return paymentMethod || null
		})
	}
	async findByUserId(userId: string): Promise<PaymentMethods[]> {
		return this.getOrSet(this.getUserCacheKey(userId), async () => {
			return await this.db.query.userPaymentMethods.findMany({
				where: and(
					eq(schema.userPaymentMethods.userId, userId),
					eq(schema.userPaymentMethods.isDeleted, false),
				),
				orderBy: (methods, { desc }) => [desc(methods.isDefault), methods.displayOrder],
			})
		})
	}
	async findBySplitId(splitId: string): Promise<PaymentMethods[]> {
		return this.getOrSet(this.getSplitCacheKey(splitId), async () => {
			const splitPaymentMethods = await this.db.query.splitPaymentMethods.findMany({
				where: eq(schema.splitPaymentMethods.splitId, splitId),
				with: {
					paymentMethod: true,
				},
				orderBy: (methods, { desc }) => [desc(methods.isPreferred), methods.displayOrder],
			})

			return splitPaymentMethods.map(spm => spm.paymentMethod).filter(pm => !pm.isDeleted)
		})
	}
	async create(data: CreatePaymentMethodData): Promise<PaymentMethods> {
		if (data.isDefault) {
			await this.db
				.update(schema.userPaymentMethods)
				.set({ isDefault: false })
				.where(eq(schema.userPaymentMethods.userId, data.userId))
		}

		const [paymentMethod] = await this.db
			.insert(schema.userPaymentMethods)
			.values({
				userId: data.userId,
				type: data.type,
				displayName: data.displayName,
				currency: data.currency || 'RUB',
				paymentData: data.paymentData,
				isTemporary: data.isTemporary || false,
				isDefault: data.isDefault || false,
				displayOrder: 0,
			})
			.returning()

		await this.cache.delete(this.getUserCacheKey(data.userId))

		return paymentMethod!
	}
	async update(id: string, data: UpdatePaymentMethodData): Promise<void> {
		const paymentMethod = await this.findById(id)
		if (!paymentMethod) return
		if (data.isDefault) {
			await this.db
				.update(schema.userPaymentMethods)
				.set({ isDefault: false })
				.where(eq(schema.userPaymentMethods.userId, paymentMethod.userId))
		}

		await this.db.update(schema.userPaymentMethods).set(data).where(eq(schema.userPaymentMethods.id, id))
		await this.cache.delete(this.getCacheKey(id))
		await this.cache.delete(this.getUserCacheKey(paymentMethod.userId))
	}
	async delete(id: string): Promise<void> {
		const paymentMethod = await this.findById(id)
		if (!paymentMethod) return

		await this.db
			.update(schema.userPaymentMethods)
			.set({
				isDeleted: true,
				deletedAt: new Date(),
			})
			.where(eq(schema.userPaymentMethods.id, id))
		await this.cache.delete(this.getCacheKey(id))
		await this.cache.delete(this.getUserCacheKey(paymentMethod.userId))
	}
	async addToSplit(
		splitId: string,
		paymentMethodId: string,
		isPreferred: boolean = false,
	): Promise<SplitPaymentMethod> {
		if (isPreferred) {
			await this.db
				.update(schema.splitPaymentMethods)
				.set({ isPreferred: false })
				.where(eq(schema.splitPaymentMethods.splitId, splitId))
		}

		const [splitPaymentMethod] = await this.db
			.insert(schema.splitPaymentMethods)
			.values({
				splitId,
				paymentMethodId,
				isPreferred,
				displayOrder: 0,
			})
			.returning()
		await this.cache.delete(this.getSplitCacheKey(splitId))
		await this.cache.delete(`split:${splitId}:base`)

		return splitPaymentMethod!
	}
	async removeFromSplit(splitId: string, paymentMethodId: string): Promise<void> {
		await this.db
			.delete(schema.splitPaymentMethods)
			.where(
				and(
					eq(schema.splitPaymentMethods.splitId, splitId),
					eq(schema.splitPaymentMethods.paymentMethodId, paymentMethodId),
				),
			)
		await this.cache.delete(this.getSplitCacheKey(splitId))
		await this.cache.delete(`split:${splitId}:base`)
	}
	async cleanupTemporary(olderThanHours: number = 24): Promise<number> {
		const cutoffDate = new Date()
		cutoffDate.setHours(cutoffDate.getHours() - olderThanHours)

		const result = await this.db
			.update(schema.userPaymentMethods)
			.set({
				isDeleted: true,
				deletedAt: new Date(),
			})
			.where(and(eq(schema.userPaymentMethods.isTemporary, true), eq(schema.userPaymentMethods.isDeleted, false)))
			.returning()

		return result.length
	}
}
