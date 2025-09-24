import { zValidator as zv } from '@hono/zod-validator'
import type { ValidationTargets } from 'hono'
import z, { type ZodType } from 'zod'

import { ValidationError } from '@/common/errors'

export const validate = <T extends ZodType, Target extends keyof ValidationTargets>(target: Target, schema: T) =>
	zv(target, schema, result => {
		if (!result.success) {
			const fields = result.error.issues.map(issue => ({
				field: issue.path.join('.') || 'unknown',
				message: issue.message,
				code: issue.code,
			}))

			const mainMessage = `validation failed for ${target}`

			const details = { target, issues: result.error.issues }

			throw new ValidationError(mainMessage, fields, details)
		}
	})

export const uuidParam = (...paramNames: string[]) => {
	const params = paramNames.length > 0 ? paramNames : ['id']

	const schemaObject = params.reduce(
		(acc, paramName) => {
			acc[paramName] = z.uuid(`parameter ${paramName} should be valid uuid`)
			return acc
		},
		{} as Record<string, unknown>,
	)

	const schema = z.object(schemaObject)
	return validate('param', schema)
}
