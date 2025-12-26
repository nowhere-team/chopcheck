export const DIVISION_METHODS = ['by_fraction', 'by_amount', 'per_unit', 'custom'] as const
export type DivisionMethod = (typeof DIVISION_METHODS)[number]

export const ITEM_GROUP_TYPES = ['receipt', 'manual', 'custom'] as const
export type ItemGroupType = (typeof ITEM_GROUP_TYPES)[number]

export const PAYMENT_METHOD_TYPES = [
	'sbp',
	'card',
	'phone',
	'bank_transfer',
	'cash',
	'crypto',
	'custom',
] as const
export type PaymentMethodType = (typeof PAYMENT_METHOD_TYPES)[number]

export const SPLIT_STATUSES = ['draft', 'active', 'completed'] as const
export type SplitStatus = (typeof SPLIT_STATUSES)[number]

export const SPLIT_PHASES = ['setup', 'voting', 'payment', 'confirming'] as const
export type SplitPhase = (typeof SPLIT_PHASES)[number]

export const WARNING_CODES = [
	'low_confidence_item',
	'possible_ocr_error',
	'price_anomaly',
	'missing_price',
	'missing_quantity',
	'multiple_alcohol_items',
	'total_mismatch',
	'unknown_category',
	'duplicate_item',
	'incomplete_place_data',
	'unreadable_receipt',
	'partial_extraction'
] as const
export type WarningCode = (typeof WARNING_CODES)[number]
