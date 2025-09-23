import { boolean, foreignKey, index, integer, jsonb, pgTable, unique, uuid, varchar } from 'drizzle-orm/pg-core'

import { divisionMethodEnum, itemTypeEnum, paymentMethodTypeEnum, paymentStatusEnum, splitPhaseEnum, splitStatusEnum } from './enums'
import { decimal, money, timestamptz } from './utils'

export const users = pgTable(
	'users',
	{
		id: uuid('id').primaryKey().defaultRandom(),

		telegramId: money('telegram_id'),
		username: varchar('username', { length: 100 }),
		displayName: varchar('display_name', { length: 255 }).notNull(),
		avatarUrl: varchar('avatar_url', { length: 512 }),

		preferences: jsonb('preferences').notNull().default('{}'),

		lastSyncedAt: timestamptz('last_synced_at'),
		lastSeenAt: timestamptz('last_seen_at').notNull().defaultNow(),

		isDeleted: boolean('is_deleted').notNull().default(false),
		deletedAt: timestamptz('deleted_at'),

		createdAt: timestamptz('created_at').notNull().defaultNow(),
		updatedAt: timestamptz('updated_at').notNull().defaultNow(),
	},
	table => [
		unique('unique_telegram_id').on(table.telegramId),
		unique('unique_username').on(table.username),

		index('idx_users_username').on(table.username),
		index('idx_users_display_name').on(table.displayName),
		index('idx_users_last_seen_at').on(table.lastSeenAt),
		index('idx_users_active').on(table.isDeleted),
		index('idx_users_telegram_active').on(table.telegramId, table.isDeleted),
	],
)

export const userPaymentMethods = pgTable(
	'user_payment_methods',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id').notNull(),

		type: paymentMethodTypeEnum('type').notNull(),
		displayName: varchar('display_name', { length: 128 }),
		currency: varchar('currency', { length: 3 }).notNull().default('RUB'),
		paymentData: jsonb('payment_data').notNull(),

		isTemporary: boolean('is_temporary').notNull().default(false),
		isDefault: boolean('is_default').notNull().default(false),
		displayOrder: integer('display_order').notNull().default(0),

		// soft delete fields
		isDeleted: boolean('is_deleted').notNull().default(false),
		deletedAt: timestamptz('deleted_at'),

		createdAt: timestamptz('created_at').notNull().defaultNow(),
		updatedAt: timestamptz('updated_at').notNull().defaultNow(),
	},
	table => [
		foreignKey({
			name: 'fk_user_payment_methods_user_id',
			columns: [table.userId],
			foreignColumns: [users.id],
		}).onDelete('restrict'),

		index('idx_user_payment_methods_user_id').on(table.userId),
		index('idx_user_payment_methods_active').on(table.userId, table.isDeleted),
		index('idx_user_payment_methods_default').on(table.userId, table.isDefault),
		index('idx_user_payment_methods_temporary').on(table.isTemporary, table.createdAt),
	],
)

export const splits = pgTable(
	'splits',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		parentSplitId: uuid('parent_split_id'),
		ownerId: uuid('owner_id').notNull(),

		status: splitStatusEnum('status').notNull().default('draft'),
		phase: splitPhaseEnum('phase').notNull().default('setup'),

		name: varchar('name', { length: 255 }).notNull(),
		icon: varchar('icon', { length: 64 }),
		currency: varchar('currency', { length: 3 }).notNull().default('RUB'),

		maxParticipants: integer('max_participants'),
		expectedParticipants: integer('expected_participants'),

		totalDiscount: money('total_discount').default(0),
		totalDiscountPercent: decimal('total_discount_percent', 5, 2).default('0'),

		defaultPermissions: jsonb('default_permissions').notNull().default({
			can_edit_items: false,
			can_edit_split: false,
			can_manage_members: false,
		}),

		paymentDeadline: timestamptz('payment_deadline'),

		scheduledAt: timestamptz('scheduled_at'),
		completedAt: timestamptz('completed_at'),

		isDeleted: boolean('is_deleted').notNull().default(false),
		deletedAt: timestamptz('deleted_at'),

		updatedAt: timestamptz('updated_at').notNull().defaultNow(),
		createdAt: timestamptz('created_at').notNull().defaultNow(),
	},
	table => [
		foreignKey({
			name: 'fk_splits_parent_split_id',
			columns: [table.parentSplitId],
			foreignColumns: [table.id],
		}).onDelete('set null'),
		foreignKey({
			name: 'fk_splits_owner_id',
			columns: [table.ownerId],
			foreignColumns: [users.id],
		}).onDelete('restrict'),

		index('idx_splits_owner_id').on(table.ownerId),
		index('idx_splits_status').on(table.status),
		index('idx_splits_phase').on(table.phase),
		index('idx_splits_owner_active').on(table.ownerId, table.isDeleted),
		index('idx_splits_parent_id').on(table.parentSplitId),
		index('idx_splits_payment_deadline').on(table.paymentDeadline),
		index('idx_splits_updated_at').on(table.updatedAt),
	],
)

export const splitParticipants = pgTable(
	'split_participants',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		splitId: uuid('split_id').notNull(),
		userId: uuid('user_id'),

		displayName: varchar('display_name', { length: 255 }),

		isReady: boolean('is_ready').notNull().default(false),
		hasPaid: boolean('has_paid').notNull().default(false),

		overriddenPermissions: jsonb('overridden_permissions').notNull().default({}),

		invitedBy: uuid('invited_by'),

		isDeleted: boolean('is_deleted').notNull().default(false),
		deletedAt: timestamptz('deleted_at'),

		joinedAt: timestamptz('joined_at').notNull().defaultNow(),
	},
	table => [
		foreignKey({
			name: 'fk_split_participants_split_id',
			columns: [table.splitId],
			foreignColumns: [splits.id],
		}).onDelete('restrict'),
		foreignKey({
			name: 'fk_split_participants_user_id',
			columns: [table.userId],
			foreignColumns: [users.id],
		}).onDelete('set null'),
		foreignKey({
			name: 'fk_split_participants_invited_by',
			columns: [table.invitedBy],
			foreignColumns: [users.id],
		}).onDelete('set null'),

		unique('unique_split_user').on(table.splitId, table.userId),

		index('idx_split_participants_split_id').on(table.splitId),
		index('idx_split_participants_user_id').on(table.userId),
		index('idx_split_participants_split_active').on(table.splitId, table.isDeleted),
		index('idx_split_participants_has_paid').on(table.splitId, table.hasPaid, table.isDeleted),
		index('idx_split_participants_is_ready').on(table.splitId, table.isReady, table.isDeleted),
	],
)

export const splitItems = pgTable(
	'split_items',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		splitId: uuid('split_id').notNull(),

		type: itemTypeEnum('type').notNull().default('product'),
		name: varchar('name', { length: 128 }).notNull(),
		description: varchar('description', { length: 2048 }),
		icon: varchar('icon', { length: 64 }),
		note: varchar('note', { length: 2048 }),
		imageUrl: varchar('image_url', { length: 512 }),
		displayOrder: integer('display_order').default(0),

		price: money('price').notNull(),
		// @ts-expect-error drizzle don't know how to serialize bigint, so use string
		itemDiscount: money('item_discount').default('0'),

		quantity: decimal('quantity', 8, 3).default('1'),
		unit: varchar('unit', { length: 32 }).default('piece'),

		defaultDivisionMethod: divisionMethodEnum('default_division_method').notNull().default('equal'),

		isDeleted: boolean('is_deleted').notNull().default(false),
		deletedAt: timestamptz('deleted_at'),

		createdAt: timestamptz('created_at').notNull().defaultNow(),
		updatedAt: timestamptz('updated_at').notNull().defaultNow(),
	},
	table => [
		foreignKey({
			name: 'fk_split_items_split_id',
			columns: [table.splitId],
			foreignColumns: [splits.id],
		}).onDelete('restrict'),

		index('idx_split_items_split_id').on(table.splitId),
		index('idx_split_items_split_active').on(table.splitId, table.isDeleted),
		index('idx_split_items_order').on(table.splitId, table.displayOrder, table.isDeleted),
		index('idx_split_items_type').on(table.splitId, table.type, table.isDeleted),
	],
)

export const splitItemParticipants = pgTable(
	'split_item_participants',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		participantId: uuid('participant_id').notNull(),
		itemId: uuid('item_id').notNull(),

		note: varchar('note', { length: 2048 }),

		divisionMethod: divisionMethodEnum('division_method').notNull(),
		participationValue: decimal('participation_value', 12, 4),

		applyTotalDiscount: boolean('apply_total_discount').notNull().default(true),
		calculatedSum: money('calculated_sum'),

		isDeleted: boolean('is_deleted').notNull().default(false),
		deletedAt: timestamptz('deleted_at'),

		createdAt: timestamptz('created_at').notNull().defaultNow(),
	},
	table => [
		foreignKey({
			name: 'fk_split_item_participants_participant_id',
			columns: [table.participantId],
			foreignColumns: [splitParticipants.id],
		}).onDelete('restrict'),
		foreignKey({
			name: 'fk_split_item_participants_item_id',
			columns: [table.itemId],
			foreignColumns: [splitItems.id],
		}).onDelete('restrict'),

		unique('unique_participant_item').on(table.participantId, table.itemId),

		index('idx_split_item_participants_participant_id').on(table.participantId),
		index('idx_split_item_participants_item_id').on(table.itemId),
		index('idx_split_item_participants_active').on(table.participantId, table.itemId, table.isDeleted),
	],
)

export const splitPaymentMethods = pgTable(
	'split_payment_methods',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		splitId: uuid('split_id').notNull(),
		paymentMethodId: uuid('payment_method_id').notNull(),

		comment: varchar('comment', { length: 2048 }),
		isPreferred: boolean('is_preferred').notNull().default(false),
		displayOrder: integer('display_order').notNull().default(0),

		createdAt: timestamptz('created_at').notNull().defaultNow(),
		updatedAt: timestamptz('updated_at').notNull().defaultNow(),
	},
	table => [
		foreignKey({
			name: 'fk_split_payment_methods_split_id',
			columns: [table.splitId],
			foreignColumns: [splits.id],
		}).onDelete('cascade'),
		foreignKey({
			name: 'fk_split_payment_methods_payment_method_id',
			columns: [table.paymentMethodId],
			foreignColumns: [userPaymentMethods.id],
		}).onDelete('cascade'),

		unique('unique_split_payment_method').on(table.splitId, table.paymentMethodId),

		index('idx_split_payment_methods_split_id').on(table.splitId),
		index('idx_split_payment_methods_preferred').on(table.splitId, table.isPreferred),
	],
)

export const splitPayments = pgTable(
	'split_payments',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		participantId: uuid('participant_id').notNull(),

		amount: money('amount').notNull(),
		paymentMethodId: uuid('payment_method_id'),

		status: paymentStatusEnum('status').notNull().default('pending'),
		confirmedAt: timestamptz('confirmed_at'),

		note: varchar('note', { length: 2048 }),
		createdAt: timestamptz('created_at').notNull().defaultNow(),
	},
	table => [
		foreignKey({
			name: 'fk_split_payments_participant_id',
			columns: [table.participantId],
			foreignColumns: [splitParticipants.id],
		}).onDelete('cascade'),
		foreignKey({
			name: 'fk_split_payments_payment_method_id',
			columns: [table.paymentMethodId],
			foreignColumns: [userPaymentMethods.id],
		}).onDelete('set null'),

		index('idx_split_payments_participant_id').on(table.participantId),
		index('idx_split_payments_status').on(table.status),
		index('idx_split_payments_pending').on(table.participantId, table.status),
		index('idx_split_payments_created_at').on(table.createdAt),

		// cleanup job
		index('idx_split_payments_old').on(table.createdAt, table.status),
	],
)

export const splitAuditLog = pgTable(
	'split_audit_log',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		splitId: uuid('split_id').notNull(),
		userId: uuid('user_id'),

		action: varchar('action', { length: 64 }).notNull(),
		entityType: varchar('entity_type', { length: 32 }).notNull(),
		entityId: uuid('entity_id'),

		oldData: jsonb('old_data'),
		newData: jsonb('new_data'),

		createdAt: timestamptz('created_at').notNull().defaultNow(),
	},
	table => [
		foreignKey({
			name: 'fk_split_audit_log_split_id',
			columns: [table.splitId],
			foreignColumns: [splits.id],
		}).onDelete('cascade'),
		foreignKey({
			name: 'fk_split_audit_log_user_id',
			columns: [table.userId],
			foreignColumns: [users.id],
		}).onDelete('set null'),

		index('idx_split_audit_log_split_id').on(table.splitId),
		index('idx_split_audit_log_user_id').on(table.userId),
		index('idx_split_audit_log_split_time').on(table.splitId, table.createdAt),
		index('idx_split_audit_log_created_at').on(table.createdAt),

		index('idx_split_audit_log_cleanup').on(table.createdAt, table.splitId),
	],
)
