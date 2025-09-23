import { relations } from 'drizzle-orm'

import {
	splitAuditLog,
	splitItemParticipants,
	splitItems,
	splitParticipants,
	splitPaymentMethods,
	splitPayments,
	splits,
	userPaymentMethods,
	users,
} from './schema'

export const usersRelations = relations(users, ({ many }) => ({
	paymentMethods: many(userPaymentMethods),
	ownedSplits: many(splits, { relationName: 'splitOwner' }),
	participations: many(splitParticipants),
	invitedParticipants: many(splitParticipants, { relationName: 'inviter' }),
	auditActions: many(splitAuditLog),
}))

export const userPaymentMethodsRelations = relations(userPaymentMethods, ({ one, many }) => ({
	user: one(users, {
		fields: [userPaymentMethods.userId],
		references: [users.id],
	}),
	splitPaymentMethods: many(splitPaymentMethods),
	payments: many(splitPayments),
}))

export const splitsRelations = relations(splits, ({ one, many }) => ({
	owner: one(users, {
		fields: [splits.ownerId],
		references: [users.id],
		relationName: 'splitOwner',
	}),
	parentSplit: one(splits, {
		fields: [splits.parentSplitId],
		references: [splits.id],
		relationName: 'parentChildSplit',
	}),
	childSplits: many(splits, { relationName: 'parentChildSplit' }),
	participants: many(splitParticipants),
	items: many(splitItems),
	paymentMethods: many(splitPaymentMethods),
	auditLogs: many(splitAuditLog),
}))

export const splitParticipantsRelations = relations(splitParticipants, ({ one, many }) => ({
	split: one(splits, {
		fields: [splitParticipants.splitId],
		references: [splits.id],
	}),
	user: one(users, {
		fields: [splitParticipants.userId],
		references: [users.id],
	}),
	invitedByUser: one(users, {
		fields: [splitParticipants.invitedBy],
		references: [users.id],
		relationName: 'inviter',
	}),
	itemParticipations: many(splitItemParticipants),
	payments: many(splitPayments),
}))

export const splitItemsRelations = relations(splitItems, ({ one, many }) => ({
	split: one(splits, {
		fields: [splitItems.splitId],
		references: [splits.id],
	}),
	participations: many(splitItemParticipants),
}))

export const splitItemParticipantsRelations = relations(splitItemParticipants, ({ one }) => ({
	participant: one(splitParticipants, {
		fields: [splitItemParticipants.participantId],
		references: [splitParticipants.id],
	}),
	item: one(splitItems, {
		fields: [splitItemParticipants.itemId],
		references: [splitItems.id],
	}),
}))

export const splitPaymentMethodsRelations = relations(splitPaymentMethods, ({ one }) => ({
	split: one(splits, {
		fields: [splitPaymentMethods.splitId],
		references: [splits.id],
	}),
	paymentMethod: one(userPaymentMethods, {
		fields: [splitPaymentMethods.paymentMethodId],
		references: [userPaymentMethods.id],
	}),
}))

export const splitPaymentsRelations = relations(splitPayments, ({ one }) => ({
	participant: one(splitParticipants, {
		fields: [splitPayments.participantId],
		references: [splitParticipants.id],
	}),
	paymentMethod: one(userPaymentMethods, {
		fields: [splitPayments.paymentMethodId],
		references: [userPaymentMethods.id],
	}),
}))

export const splitAuditLogRelations = relations(splitAuditLog, ({ one }) => ({
	split: one(splits, {
		fields: [splitAuditLog.splitId],
		references: [splits.id],
	}),
	user: one(users, {
		fields: [splitAuditLog.userId],
		references: [users.id],
	}),
}))
