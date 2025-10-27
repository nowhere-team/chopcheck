import { and, eq } from 'drizzle-orm'

import type { PaymentMethod, SplitPaymentMethod } from '@/common/types'
import { schema } from '@/platform/database'

import { BaseRepository } from './base'

type CreatePaymentMethodData = Pick<PaymentMethod, 'userId' | 'type' | 'displayName' | 'currency' | 'paymentData' | 'isTemporary' | 'isDefault'>
type UpdatePaymentMethodData = Partial<Pick<PaymentMethod, 'displayName' | 'isDefault' | 'displayOrder'>>

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

	/**
	 * найти метод оплаты по id
	 */
	async findById(id: string): Promise<PaymentMethod | null> {
		return this.getOrSet(this.getCacheKey(id), async () => {
			const paymentMethod = await this.db.query.userPaymentMethods.findFirst({
				where: and(
					eq(schema.userPaymentMethods.id, id),
					eq(schema.userPaymentMethods.isDeleted, false)
				),
			})

			return paymentMethod || null
		})
	}

	/**
	 * получить все методы оплаты юзера
	 */
	async findByUserId(userId: string): Promise<PaymentMethod[]> {
		return this.getOrSet(this.getUserCacheKey(userId), async () => {
			return await this.db.query.userPaymentMethods.findMany({
				where: and(
					eq(schema.userPaymentMethods.userId, userId),
					eq(schema.userPaymentMethods.isDeleted, false)
				),
				orderBy: (methods, { desc }) => [desc(methods.isDefault), methods.displayOrder],
			})
		})
	}

	/**
	 * получить методы оплаты привязанные к сплиту
	 */
	async findBySplitId(splitId: string): Promise<PaymentMethod[]> {
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

	/**
	 * создать новый метод оплаты
	 */
	async create(data: CreatePaymentMethodData): Promise<PaymentMethod> {
		// если это метод по умолчанию, убираем флаг с других
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

		// инвалидируем кэш юзера
		await this.cache.delete(this.getUserCacheKey(data.userId))

		return paymentMethod!
	}

	/**
	 * обновить метод оплаты
	 */
	async update(id: string, data: UpdatePaymentMethodData): Promise<void> {
		const paymentMethod = await this.findById(id)
		if (!paymentMethod) {
			throw new Error('payment method not found')
		}

		// если делаем дефолтным, снимаем флаг с других
		if (data.isDefault) {
			await this.db
				.update(schema.userPaymentMethods)
				.set({ isDefault: false })
				.where(eq(schema.userPaymentMethods.userId, paymentMethod.userId))
		}

		await this.db
			.update(schema.userPaymentMethods)
			.set(data)
			.where(eq(schema.userPaymentMethods.id, id))

		// инвалидируем кэш
		await this.cache.delete(this.getCacheKey(id))
		await this.cache.delete(this.getUserCacheKey(paymentMethod.userId))
	}

	/**
	 * удалить метод оплаты (soft delete)
	 */
	async delete(id: string): Promise<void> {
		const paymentMethod = await this.findById(id)
		if (!paymentMethod) {
			throw new Error('payment method not found')
		}

		await this.db
			.update(schema.userPaymentMethods)
			.set({
				isDeleted: true,
				deletedAt: new Date(),
			})
			.where(eq(schema.userPaymentMethods.id, id))

		// инвалидируем кэш
		await this.cache.delete(this.getCacheKey(id))
		await this.cache.delete(this.getUserCacheKey(paymentMethod.userId))
	}

	/**
	 * привязать метод оплаты к сплиту
	 */
	async addToSplit(splitId: string, paymentMethodId: string, isPreferred: boolean = false): Promise<SplitPaymentMethod> {
		// проверяем что метод существует
		const paymentMethod = await this.findById(paymentMethodId)
		if (!paymentMethod) {
			throw new Error('payment method not found')
		}

		// если делаем предпочтительным, снимаем флаг с других
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

		// инвалидируем кэш сплита
		await this.cache.delete(this.getSplitCacheKey(splitId))

		return splitPaymentMethod!
	}

	/**
	 * отвязать метод оплаты от сплита
	 */
	async removeFromSplit(splitId: string, paymentMethodId: string): Promise<void> {
		await this.db
			.delete(schema.splitPaymentMethods)
			.where(
				and(
					eq(schema.splitPaymentMethods.splitId, splitId),
					eq(schema.splitPaymentMethods.paymentMethodId, paymentMethodId)
				)
			)

		// инвалидируем кэш
		await this.cache.delete(this.getSplitCacheKey(splitId))
	}

	/**
	 * удалить временные методы оплаты старше указанного времени
	 * (для очистки методов которые были созданы при создании сплита)
	 */
	async cleanupTemporary(olderThanHours: number = 24): Promise<number> {
		const cutoffDate = new Date()
		cutoffDate.setHours(cutoffDate.getHours() - olderThanHours)

		const result = await this.db
			.update(schema.userPaymentMethods)
			.set({
				isDeleted: true,
				deletedAt: new Date(),
			})
			.where(
				and(
					eq(schema.userPaymentMethods.isTemporary, true),
					eq(schema.userPaymentMethods.isDeleted, false)
				)
			)
			.returning()

		return result.length
	}
}