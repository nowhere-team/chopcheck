export interface FnsReceiptData {
	// raw fns response fields
	user?: string
	retailPlace?: string
	retailPlaceAddress?: string
	userInn?: string
	dateTime?: string
	totalSum?: number
	cashTotalSum?: number
	ecashTotalSum?: number
	nds10?: number
	nds18?: number
	fiscalDriveNumber?: string
	fiscalDocumentNumber?: number
	fiscalSign?: number
	items?: FnsItem[]
}

export interface FnsItem {
	name: string
	price: number
	quantity: number
	sum: number
	nds?: number
	paymentType?: number
	productType?: number
}

export interface FnsResponse {
	code: number
	data?: {
		json: FnsReceiptData
	}
}

export interface TokenState {
	value: string
	successCount: number
	errorCount: number
	lastUsed: number
	lastError?: string
	disabled: boolean
	disabledUntil?: number
}

export interface FnsClientConfig {
	apiUrl: string
	tokens: string[]
	rotationMinutes: number
	requestTimeout: number
}
