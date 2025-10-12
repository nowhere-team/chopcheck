import { Composer } from 'grammy'

import type { Context } from '@/bot/types'

export function start() {
	const cmd = new Composer<Context>()

	cmd.command('start', async ctx => {
		await ctx.reply('Привет!', {
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: 'Открыть приложение',
							web_app: { url: ctx.config.webAppUrl || 'https://example.com' },
						},
					],
				],
			},
		})
	})

	return cmd
}
