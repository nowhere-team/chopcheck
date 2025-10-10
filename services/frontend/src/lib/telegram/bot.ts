import { Bot } from 'grammy';

import { TELEGRAM_BOT_TOKEN } from '$env/static/private';
import { PUBLIC_APP_URL } from '$env/static/public';

export const bot = new Bot(TELEGRAM_BOT_TOKEN, { client: { environment: 'test' } });

bot.command('start', async ctx => {
	await ctx.reply('Привет!', {
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: 'Открыть приложение',
						web_app: { url: PUBLIC_APP_URL || 'https://example.com' }
					}
				]
			]
		}
	});
});

export async function startTelegramBot() {
	await bot.start({
		onStart: botInfo => {
			console.log('telegram bot started', botInfo.username);
		}
	});
}

export async function stopTelegramBot() {
	await bot.stop();
}
