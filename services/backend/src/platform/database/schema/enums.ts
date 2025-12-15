import { pgEnum } from 'drizzle-orm/pg-core'

export const DIVISION_METHODS = ['by_fraction', 'by_amount', 'per_unit', 'custom'] as const
export type DivisionMethod = (typeof DIVISION_METHODS)[number]

export const divisionMethodEnum = pgEnum('division_method', DIVISION_METHODS)

export const splitStatusEnum = pgEnum('split_status', ['draft', 'active', 'completed'])

export const splitPhaseEnum = pgEnum('split_phase', ['setup', 'voting', 'payment', 'confirming'])

export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'confirmed', 'disputed'])

export const itemTypeEnum = pgEnum('item_type', ['product', 'tip', 'delivery', 'service_fee', 'tax'])

export const paymentMethodTypeEnum = pgEnum('payment_method_type', [
	'sbp',
	'card',
	'phone',
	'bank_transfer',
	'cash',
	'crypto',
	'custom',
])

export const receiptSourceEnum = pgEnum('receipt_source', ['qr', 'image', 'manual'])

export const receiptStatusEnum = pgEnum('receipt_status', ['pending', 'processing', 'enriched', 'failed'])
