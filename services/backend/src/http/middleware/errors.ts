import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'

import { ApiError, ErrorSeverity, InternalError, NotFoundError, ValidationError } from '@/common/errors'
import type { Logger } from '@/platform/logger'

const HTTP_ERROR_MAPPING = {
	404: (path: string) => new NotFoundError('route not found', { path }),
	400: (path: string) => new ValidationError('bad request', undefined, { path }),
} as const

function transformError(err: Error, path: string): ApiError {
	if (err instanceof ApiError) {
		return err
	}

	if (err instanceof HTTPException) {
		const createError = HTTP_ERROR_MAPPING[err.status as keyof typeof HTTP_ERROR_MAPPING]
		return createError ? createError(path) : new InternalError('http exception', { status: err.status, path })
	}

	return new InternalError('unknown error', {
		originalMessage: err.message,
		errorName: err.name,
		stack: err.stack,
		cause: 'cause' in err ? (err as any).cause : undefined,
		path,
	})
}

function logError(logger: Logger, error: ApiError, path: string, traceId?: string) {
	const baseContext = { path, code: error.code, severity: error.severity, traceId }

	switch (error.severity) {
		case ErrorSeverity.LOW:
			logger.debug(error.message, baseContext)
			break
		case ErrorSeverity.MEDIUM:
			logger.warn(error.message, baseContext)
			break
		case ErrorSeverity.HIGH:
		case ErrorSeverity.CRITICAL:
			logger.error(error.message, {
				...baseContext,
				details: error.details,
				stack: error.stack,
			})
			break
	}
}

export const errorHandler: ErrorHandler = (err, c) => {
	const logger = c.get('logger')
	const path = c.req.path
	const traceId = c.get('traceId')

	const error = transformError(err, path)
	logError(logger, error, path, traceId)

	const response = error.toResponse()
	if (traceId) {
		;(response as any).traceId = traceId
	}

	return c.json(response, error.status)
}
