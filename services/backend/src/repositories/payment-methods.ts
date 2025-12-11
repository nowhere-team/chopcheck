import { and, eq } from 'drizzle-orm'

import type { PaymentMethod } from '@/common/types'
import { schema } from '@/platform/database'

import { BaseRepository } from './base'

type NewPaymentMethod = typeof schema.userPaymentMethods.$inferInsert

export class PaymentMethodsRepository extends BaseRepository {
	private userKey(userId: string) {
		return `user:${userId}:payment_methods`
	}

	private splitKey(splitId: string) {
		return `split:${splitId}:payment_methods`
	}

	async findById(id: string): Promise<PaymentMethod | null> {
		const pm = await this.db.query.userPaymentMethods.findFirst({
			where: and(eq(schema.userPaymentMethods.id, id), eq(schema.userPaymentMethods.isDeleted, false)),
		})
		return (pm as PaymentMethod) || null
	}

	async findByUserId(userId: string): Promise<PaymentMethod[]> {
		return this.cached(this.userKey(userId), async () => {
			const methods = await this.db.query.userPaymentMethods.findMany({
				where: and(
					eq(schema.userPaymentMethods.userId, userId),
					eq(schema.userPaymentMethods.isDeleted, false),
				),
				orderBy: (m, { desc }) => [desc(m.isDefault), m.displayOrder],
			})
			return methods as PaymentMethod[]
		})
	}

	async findBySplitId(splitId: string): Promise<PaymentMethod[]> {
		return this.cached(this.splitKey(splitId), async () => {
			const spm = await this.db.query.splitPaymentMethods.findMany({
				where: eq(schema.splitPaymentMethods.splitId, splitId),
				with: { paymentMethod: true },
				orderBy: (m, { desc }) => [desc(m.isPreferred), m.displayOrder],
			})
			return spm.map(s => s.paymentMethod).filter(pm => !pm.isDeleted) as PaymentMethod[]
		})
	}

	async create(data: NewPaymentMethod): Promise<PaymentMethod> {
		if (data.isDefault) {
			await this.db
				.update(schema.userPaymentMethods)
				.set({ isDefault: false })
				.where(eq(schema.userPaymentMethods.userId, data.userId))
		}

		const [pm] = await this.db.insert(schema.userPaymentMethods).values(data).returning()
		await this.invalidate(this.userKey(data.userId))
		return pm as PaymentMethod
	}

	async update(id: string, data: Partial<PaymentMethod>): Promise<void> {
		const pm = await this.findById(id)
		if (!pm) return

		if (data.isDefault) {
			await this.db
				.update(schema.userPaymentMethods)
				.set({ isDefault: false })
				.where(eq(schema.userPaymentMethods.userId, pm.userId))
		}

		await this.db
			.update(schema.userPaymentMethods)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(schema.userPaymentMethods.id, id))
		await this.invalidate(this.userKey(pm.userId))
	}

	async delete(id: string): Promise<void> {
		const pm = await this.findById(id)
		if (!pm) return

		await this.db
			.update(schema.userPaymentMethods)
			.set({ isDeleted: true, deletedAt: new Date() })
			.where(eq(schema.userPaymentMethods.id, id))
		await this.invalidate(this.userKey(pm.userId))
	}

	async addToSplit(splitId: string, paymentMethodId: string, isPreferred: boolean = false): Promise<void> {
		if (isPreferred) {
			await this.db
				.update(schema.splitPaymentMethods)
				.set({ isPreferred: false })
				.where(eq(schema.splitPaymentMethods.splitId, splitId))
		}

		await this.db
			.insert(schema.splitPaymentMethods)
			.values({ splitId, paymentMethodId, isPreferred })
			.onConflictDoNothing()
		await this.invalidate(this.splitKey(splitId))
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
		await this.invalidate(this.splitKey(splitId))
	}
}
