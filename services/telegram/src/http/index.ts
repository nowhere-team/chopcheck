import { Hono } from 'hono'
import { cors } from 'hono/cors'

import type { Bot } from '@/bot'
import type { Logger } from '@/platform/logger'

interface CreateShareMessageRequest {
	userId: number
	splitName: string
	splitShortId: string
	webAppUrl: string
}

interface CreateShareMessageResponse {
	preparedMessageId: string
}

export function createHttpServer(bot: Bot, logger: Logger, port: number, botUsername: string) {
	const app = new Hono()
		.use(cors())
		.post('/api/share-message', async c => {
			const body = await c.req.json<CreateShareMessageRequest>()

			try {
				const result = await bot.bot.api.savePreparedInlineMessage(
					body.userId,
					{
						type: 'article',
						id: body.splitShortId,
						title: 'Присоединяйтесь к сплиту',
						description: body.splitName,
						input_message_content: {
							message_text: `Присоединяйтесь к моему сплиту "${body.splitName}"!`,
						},
						reply_markup: {
							inline_keyboard: [
								[
									{
										text: 'Перейти к сплиту',
										url: `https://t.me/${botUsername}?start=split_${body.splitShortId}`,
									},
								],
							],
						},
					},
					{
						allow_group_chats: true,
						allow_user_chats: true,
					},
				)

				return c.json<CreateShareMessageResponse>({
					preparedMessageId: result.id,
				})
			} catch (error) {
				logger.error('failed to create share message', { error })
				return c.json({ error: 'failed to create share message' }, 500)
			}
		})
		.get('/health', c => c.json({ status: 'ok' }))

	const server = Bun.serve({
		fetch: app.fetch,
		port,
	})

	logger.info('http server started', { port })

	return server
}
