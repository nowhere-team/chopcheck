import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

import { paraglideMiddleware } from '$lib/paraglide/server'

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request
		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		})
	})

const handleCacheHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event)

	if (event.url.pathname.startsWith('/emoji/')) {
		response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
	}

	return response
}

export const handle: Handle = sequence(handleParaglide, handleCacheHeaders)
