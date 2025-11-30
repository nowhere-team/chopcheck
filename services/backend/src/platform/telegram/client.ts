import ky, { type KyInstance } from 'ky'

import type { Logger } from '@/platform/logger'

export class TelegramServiceClient {
	private readonly api: KyInstance

	constructor(
		serviceUrl: string,
		private readonly logger: Logger,
	) {
		this.api = ky.create({
			prefixUrl: serviceUrl,
			timeout: 10000,
			retry: { limit: 2, methods: ['post'], statusCodes: [408, 429, 500, 502, 503, 504] },
		})
	}

	async createShareMessage(
		userId: number,
		splitName: string,
		splitShortId: string,
		webAppUrl: string,
	): Promise<string> {
		this.logger.debug('creating share message', { userId, splitShortId })
		const response = await this.api
			.post('api/share-message', { json: { userId, splitName, splitShortId, webAppUrl } })
			.json<{ preparedMessageId: string }>()
		return response.preparedMessageId
	}
}
