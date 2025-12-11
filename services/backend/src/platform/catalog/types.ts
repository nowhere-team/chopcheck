export interface EnrichRequest {
	type: 'receipt'
	source: ImageSource | StructuredSource | RawTextSource
	extensions?: string[]
}

export interface ImageSource {
	type: 'image'
	data: string // base64
}

export interface StructuredSource {
	type: 'structured'
	data: {
		items: Array<{
			name: string
			quantity?: number
			price?: number
			sum?: number
		}>
		place?: {
			name: string
			address?: string
			inn?: string
		}
		total?: number
		date?: string
	}
}

export interface RawTextSource {
	type: 'raw_text'
	data: string
}

export interface EnrichedItem {
	rawName: string
	name: string
	category: string
	subcategory: string
	gtin?: string
	tags: string[]
	emoji: string
	quantity?: number
	unit?: string
	unitSize?: number
	price?: number
	sum?: number
	discount?: number
	splitMethod?: string
	confidence: number
	id?: string
	isNew?: boolean
}

export interface EnrichedPlace {
	name: string
	type: string
	subtype: string
	cuisine?: string[]
	address?: string
	city?: string
	tags: string[]
	emoji?: string
	id?: string
	isNew?: boolean
}

export interface EnrichedReceipt {
	currency: string
	date?: string
	number?: string
	paymentMethod?: string
	subtotal?: number
	discountTotal?: number
	serviceFeesTotal?: number
	taxTotal?: number
	total: number
	paid?: number
	change?: number
}

export interface Warning {
	code: string
	itemIndex?: number
	details?: string
}

export interface EnrichResponse {
	language?: 'ru' | 'en'
	items: EnrichedItem[]
	place?: EnrichedPlace
	receipt?: EnrichedReceipt
	warnings: Warning[]
	cached: boolean
	usage?: {
		promptTokens: number
		completionTokens: number
		totalTokens: number
	}
}

export type StreamEventType =
	| 'started'
	| 'item'
	| 'place'
	| 'receipt'
	| 'language'
	| 'warning'
	| 'completed'
	| 'error'
	| 'ping'

export interface StreamEvent {
	type: StreamEventType
	data: unknown
	timestamp?: number
}

export interface CatalogClientConfig {
	serviceUrl: string
	requestTimeout: number
}
