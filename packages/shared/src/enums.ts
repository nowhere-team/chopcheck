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
