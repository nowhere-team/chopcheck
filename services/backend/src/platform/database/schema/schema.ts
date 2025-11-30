import { bigint, boolean, foreignKey, index, integer, jsonb, pgTable, unique, uuid, varchar } from 'drizzle-orm/pg-core'

import {
	divisionMethodEnum,
	itemTypeEnum,
	paymentMethodTypeEnum,
	paymentStatusEnum,
	receiptSourceEnum,
	receiptStatusEnum,
	splitPhaseEnum,
	splitStatusEnum,
} from './enums'
import { decimal, money, timestamptz } from './utils'

// ============================================================================
// USERS
// ============================================================================

export const users = pgTable(
	'users',
	{
		id: uuid('id').primaryKey().defaultRandom(),

		telegramId: bigint('telegram_id', { mode: 'number' }),
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
		index('idx_users_telegram_active').on(table.telegramId, table.isDeleted),
	],
)

// ============================================================================
// PAYMENT METHODS
// ============================================================================

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
	],
)

// ============================================================================
// RECEIPTS
// ============================================================================

export const receipts = pgTable(
	'receipts',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id').notNull(),

		// source info
		source: receiptSourceEnum('source').notNull(),
		status: receiptStatusEnum('status').notNull().default('pending'),

		// qr data (from fns)
		qrRaw: varchar('qr_raw', { length: 512 }),
		fiscalNumber: varchar('fiscal_number', { length: 32 }),
		fiscalDocument: varchar('fiscal_document', { length: 32 }),
		fiscalSign: varchar('fiscal_sign', { length: 32 }),

		// place info
		placeName: varchar('place_name', { length: 255 }),
		placeAddress: varchar('place_address', { length: 512 }),
		placeInn: varchar('place_inn', { length: 12 }),

		// totals
		currency: varchar('currency', { length: 3 }).notNull().default('RUB'),
		subtotal: money('subtotal'),
		discountTotal: money('discount_total'),
		serviceFeesTotal: money('service_fees_total'),
		taxTotal: money('tax_total'),
		total: money('total').notNull(),

		// timestamps from receipt
		receiptDate: timestamptz('receipt_date'),

		// raw fns response
		fnsData: jsonb('fns_data'),

		// enrichment result from catalog
		enrichmentData: jsonb('enrichment_data'),
		enrichedAt: timestamptz('enriched_at'),

		// error tracking
		lastError: varchar('last_error', { length: 2048 }),
		retryCount: integer('retry_count').notNull().default(0),

		createdAt: timestamptz('created_at').notNull().defaultNow(),
		updatedAt: timestamptz('updated_at').notNull().defaultNow(),
	},
	table => [
		foreignKey({
			name: 'fk_receipts_user_id',
			columns: [table.userId],
			foreignColumns: [users.id],
		}).onDelete('restrict'),
		index('idx_receipts_user_id').on(table.userId),
		index('idx_receipts_status').on(table.status),
		index('idx_receipts_fiscal').on(table.fiscalNumber, table.fiscalDocument),
		index('idx_receipts_user_created').on(table.userId, table.createdAt),
	],
)

export const receiptItems = pgTable(
	'receipt_items',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		receiptId: uuid('receipt_id').notNull(),

		// raw data from fns/ocr
		rawName: varchar('raw_name', { length: 512 }).notNull(),

		// enriched data
		name: varchar('name', { length: 256 }),
		category: varchar('category', { length: 64 }),
		subcategory: varchar('subcategory', { length: 64 }),
		emoji: varchar('emoji', { length: 8 }),
		tags: jsonb('tags').default('[]'),

		// pricing
		price: money('price').notNull(),
		quantity: decimal('quantity', 10, 3).notNull().default('1'),
		unit: varchar('unit', { length: 32 }).default('piece'),
		sum: money('sum').notNull(),
		discount: money('discount').default(0),

		// split method suggestion
		suggestedSplitMethod: divisionMethodEnum('suggested_split_method'),

		// ordering
		displayOrder: integer('display_order').notNull().default(0),

		// catalog reference
		catalogItemId: uuid('catalog_item_id'),

		createdAt: timestamptz('created_at').notNull().defaultNow(),
	},
	table => [
		foreignKey({
			name: 'fk_receipt_items_receipt_id',
			columns: [table.receiptId],
			foreignColumns: [receipts.id],
		}).onDelete('cascade'),
		index('idx_receipt_items_receipt_id').on(table.receiptId),
		index('idx_receipt_items_order').on(table.receiptId, table.displayOrder),
	],
)

// ============================================================================
// SPLITS
// ============================================================================

export const splits = pgTable(
	'splits',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		shortId: varchar('short_id', { length: 12 }),
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

		// cached totals for fast access
		cachedTotal: money('cached_total'),
		cachedCollected: money('cached_collected'),
		calculatedAt: timestamptz('calculated_at'),

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
		unique('unique_short_id').on(table.shortId),
		index('idx_splits_owner_id').on(table.ownerId),
		index('idx_splits_status').on(table.status),
		index('idx_splits_owner_active').on(table.ownerId, table.isDeleted),
		index('idx_splits_updated_at').on(table.updatedAt),
	],
)

// link splits to receipts (many-to-many)
export const splitReceipts = pgTable(
	'split_receipts',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		splitId: uuid('split_id').notNull(),
		receiptId: uuid('receipt_id').notNull(),

		displayOrder: integer('display_order').notNull().default(0),

		createdAt: timestamptz('created_at').notNull().defaultNow(),
	},
	table => [
		foreignKey({
			name: 'fk_split_receipts_split_id',
			columns: [table.splitId],
			foreignColumns: [splits.id],
		}).onDelete('cascade'),
		foreignKey({
			name: 'fk_split_receipts_receipt_id',
			columns: [table.receiptId],
			foreignColumns: [receipts.id],
		}).onDelete('cascade'),
		unique('unique_split_receipt').on(table.splitId, table.receiptId),
		index('idx_split_receipts_split_id').on(table.splitId),
		index('idx_split_receipts_receipt_id').on(table.receiptId),
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
		isAnonymous: boolean('is_anonymous').notNull().default(false),

		// cached calculation result
		cachedTotal: money('cached_total'),

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
	],
)

export const splitItems = pgTable(
	'split_items',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		splitId: uuid('split_id').notNull(),

		// optional link to receipt item
		receiptItemId: uuid('receipt_item_id'),

		type: itemTypeEnum('type').notNull().default('product'),
		name: varchar('name', { length: 128 }).notNull(),
		description: varchar('description', { length: 2048 }),
		icon: varchar('icon', { length: 64 }),
		note: varchar('note', { length: 2048 }),
		imageUrl: varchar('image_url', { length: 512 }),
		displayOrder: integer('display_order').default(0),

		price: money('price').notNull(),
		itemDiscount: money('item_discount').default(0),

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
		foreignKey({
			name: 'fk_split_items_receipt_item_id',
			columns: [table.receiptItemId],
			foreignColumns: [receiptItems.id],
		}).onDelete('set null'),
		index('idx_split_items_split_id').on(table.splitId),
		index('idx_split_items_split_active').on(table.splitId, table.isDeleted),
		index('idx_split_items_order').on(table.splitId, table.displayOrder, table.isDeleted),
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

		// calculated result
		calculatedBase: money('calculated_base'),
		calculatedDiscount: money('calculated_discount'),
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
		index('idx_split_audit_log_split_time').on(table.splitId, table.createdAt),
	],
)
