import { Composer } from 'grammy'

import type { Context } from '@/bot/types'

export function start() {
	const cmd = new Composer<Context>()

	cmd.command('start', async ctx => {
		const payload = ctx.match

		if (payload && payload.startsWith('split_')) {
			const shortId = payload.replace('split_', '')

			await ctx.reply('Открывайте сплит и присоединяйтесь!', {
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: 'Открыть сплит',
								web_app: {
									url: `${ctx.config.webAppUrl}split/${shortId}`,
								},
							},
						],
					],
				},
			})

			return
		}

		await ctx.reply('Привет! Готовы делить счета?', {
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: 'Открыть приложение',
							web_app: { url: ctx.config.webAppUrl },
						},
					],
				],
			},
		})
	})

	return cmd
}
