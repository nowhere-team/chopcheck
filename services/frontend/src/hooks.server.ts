import type { Handle } from '@sveltejs/kit';

import { building } from '$app/environment';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { startTelegramBot, stopTelegramBot } from '$telegram/bot';

if (!building) {
	startTelegramBot().then();

	process.on('exit', async () => {
		await stopTelegramBot();
	});
}

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

export const handle: Handle = handleParaglide;
