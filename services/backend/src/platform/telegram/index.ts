import type { Logger } from '@/platform/logger'

import { TelegramServiceClient } from './client'

export function createTelegramClient(logger: Logger, serviceUrl: string) {
	return new TelegramServiceClient(serviceUrl, logger.named('telegram'))
}

export { TelegramServiceClient } from './client'
