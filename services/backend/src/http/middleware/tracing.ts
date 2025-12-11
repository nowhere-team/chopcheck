import type { MiddlewareHandler } from 'hono'

import type { Tracer } from '@/platform/tracing'

export function tracing(tracer: Tracer): MiddlewareHandler {
	return async (c, next) => {
		if (!tracer.enabled) {
			await next()
			return
		}

		// extract parent context from headers
		const headers: Record<string, string> = {}
		c.req.raw.headers.forEach((value, key) => {
			headers[key.toLowerCase()] = value
		})

		const parentContext = tracer.extract(headers)

		const spanName = `${c.req.method} ${c.req.path}`
		const attributes = {
			'http.method': c.req.method,
			'http.url': c.req.url,
			'http.route': c.req.path,
			'http.user_agent': c.req.header('user-agent'),
		}

		const ctx = parentContext
			? tracer.startSpanFromContext(spanName, parentContext, attributes)
			: tracer.startSpan(spanName, attributes)

		c.set('span', ctx)
		c.set('traceId', ctx.traceId)

		// add trace id to logger
		const loggerWithTrace = c.get('logger').withTraceId(ctx.traceId)
		c.set('logger', loggerWithTrace)

		try {
			await next()

			ctx.setAttribute('http.status_code', c.res.status)
			ctx.end(c.res.status >= 400 ? 'error' : 'ok')
		} catch (error) {
			ctx.setAttribute('error', true)
			ctx.setAttribute('error.message', (error as Error).message)
			ctx.end('error')
			throw error
		}
	}
}
