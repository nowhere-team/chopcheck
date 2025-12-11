import type { CatalogClient, EnrichResponse, StreamEvent } from '@/platform/catalog'
import type { FnsClient, FnsReceiptData } from '@/platform/fns'
import type { TelegramServiceClient } from '@/platform/telegram'

export function createMockTelegramClient(): TelegramServiceClient {
	return {
		createShareMessage: async () => 'mock-prepared-message-id',
	} as unknown as TelegramServiceClient
}

export function createMockFnsClient(): FnsClient {
	const mockReceipt: FnsReceiptData = {
		user: 'Test Store',
		retailPlace: 'Test Cafe',
		retailPlaceAddress: 'Test Address 123',
		userInn: '1234567890',
		dateTime: new Date().toISOString(),
		totalSum: 150000, // 1500.00 in kopecks
		items: [
			{ name: 'Pizza', price: 120000, quantity: 1, sum: 120000 },
			{ name: 'Cola', price: 15000, quantity: 2, sum: 30000 },
		],
	}

	return {
		getReceiptByQr: async () => mockReceipt,
		parseQrData: (qrRaw: string) => {
			if (qrRaw.includes('t=') && qrRaw.includes('fn=')) {
				return {
					t: '20241201T1200',
					s: '1500.00',
					fn: '1234567890',
					i: '12345',
					fp: '67890',
					n: '1',
				}
			}
			return null
		},
		getTokenStats: () => [],
	} as unknown as FnsClient
}

export function createMockCatalogClient(): CatalogClient {
	const mockEnrichResponse: EnrichResponse = {
		language: 'ru',
		items: [
			{
				rawName: 'Pizza',
				name: 'Пицца Маргарита',
				category: 'food',
				subcategory: 'pizza',
				tags: ['italian', 'hot'],
				emoji: '🍕',
				price: 1200,
				sum: 1200,
				quantity: 1,
				confidence: 0.95,
			},
		],
		place: {
			name: 'Test Cafe',
			type: 'restaurant',
			subtype: 'cafe',
			tags: ['casual'],
		},
		receipt: {
			currency: 'RUB',
			total: 1500,
		},
		warnings: [],
		cached: false,
	}

	return {
		enrich: async () => mockEnrichResponse,
		enrichStream: async function* (): AsyncGenerator<StreamEvent> {
			yield { type: 'started', data: {} }
			for (const item of mockEnrichResponse.items) {
				yield { type: 'item', data: item }
			}
			if (mockEnrichResponse.place) {
				yield { type: 'place', data: mockEnrichResponse.place }
			}
			yield { type: 'completed', data: { response: mockEnrichResponse } }
		},
		// @ts-expect-error just tests
		buildStructuredRequest: (items, place, total, date) => ({
			type: 'receipt',
			source: { type: 'structured', data: { items, place, total, date } },
		}),
		buildImageRequest: (base64: string) => ({
			type: 'receipt',
			source: { type: 'image', data: base64 },
		}),
	} as unknown as CatalogClient
}
