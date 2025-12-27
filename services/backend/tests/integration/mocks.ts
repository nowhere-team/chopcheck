import type { CatalogClient, EnrichRequest, EnrichResponse, StreamEvent } from '@nowhere-team/catalog'

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
		totalSum: 150000, // 1500.00
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
		images: [],
		savedImages: [],
		items: [
			{
				id: 'item-1',
				isNew: true,
				rawName: 'Pizza',
				name: 'Пицца Маргарита',
				category: 'food',
				subcategory: 'bakery', // fallback for type safety
				tags: ['italian', 'hot'],
				emoji: '🍕',
				price: 1200,
				sum: 1200,
				quantity: 1,
				confidence: 0.95,
				unit: 'piece',
				splitMethod: 'per_unit',
			},
		],
		place: {
			id: 'place-1',
			isNew: true,
			name: 'Test Cafe',
			type: 'restaurant',
			subtype: 'casual',
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
			yield {
				type: 'started',
				data: {
					enrichmentType: 'receipt',
					sourceType: 'image',
					imageCount: 1,
					savedImages: [],
				},
			}

			// yield items with index
			for (let i = 0; i < mockEnrichResponse.items.length; i++) {
				const item = mockEnrichResponse.items[i]!
				yield {
					type: 'item',
					data: { index: i, item },
				}
			}

			if (mockEnrichResponse.place) {
				yield {
					type: 'place',
					data: { place: mockEnrichResponse.place },
				}
			}

			yield {
				type: 'completed',
				data: { response: mockEnrichResponse },
			}
		},
		// Mock implementation for helpers just to satisfy the interface if used
		buildStructuredRequest: (fnsData: any) =>
			({
				type: 'receipt',
				source: { type: 'structured', data: fnsData },
			}) as EnrichRequest,
		buildImageRequest: (images: string[]) =>
			({
				type: 'receipt',
				source: { type: 'image', data: images },
			}) as EnrichRequest,
	} as unknown as CatalogClient
}
