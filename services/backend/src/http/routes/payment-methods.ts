import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

// валидация схем
const paymentMethodTypeSchema = z.enum(['sbp', 'card', 'phone', 'bank_transfer', 'cash', 'crypto', 'custom'])

const createPaymentMethodSchema = z.object({
	type: paymentMethodTypeSchema,
	displayName: z.string().max(128).optional(),
	currency: z.string().length(3).optional(),
	paymentData: z.object({
		// для sbp
		phone: z.string().optional(),
		// для card
		cardNumber: z.string().optional(),
		cardHolder: z.string().optional(),
		// для bank_transfer
		accountNumber: z.string().optional(),
		bankName: z.string().optional(),
		bik: z.string().optional(),
		// для phone
		phoneNumber: z.string().optional(),
		// для cash/crypto/custom
		description: z.string().optional(),
	}),
	isTemporary: z.boolean().optional(),
	isDefault: z.boolean().optional(),
})

const updatePaymentMethodSchema = z.object({
	displayName: z.string().max(128).optional(),
	isDefault: z.boolean().optional(),
})

const addPaymentMethodToSplitSchema = z.object({
	paymentMethodId: z.string().uuid(),
	comment: z.string().max(2048).optional(),
	isPreferred: z.boolean().optional(),
})

// создаем роутер
export const paymentMethodsRoutes = new Hono()

/**
 * GET /payment-methods - получить свои методы оплаты
 */
paymentMethodsRoutes.get('/', async c => {
	const authContext = c.get('authContext')
	if (!authContext) {
		return c.json({ error: 'unauthorized' }, 401)
	}

	const userId = authContext.userId
	const splitsService = c.get('services').splits

	const methods = await splitsService.getMyPaymentMethods(userId)

	return c.json({
		success: true,
		data: methods,
	})
})

/**
 * POST /payment-methods - создать новый метод оплаты
 */
paymentMethodsRoutes.post('/', async c => {
	console.log('==================== POST /payment-methods ====================')

	// логируем headers
	const contentType = c.req.header('content-type')
	const auth = c.req.header('authorization')
	console.log('CONTENT-TYPE:', contentType)
	console.log('AUTHORIZATION:', auth ? 'present' : 'missing')

	// логируем authContext
	const authContext = c.get('authContext')
	console.log('AUTH CONTEXT:', authContext ? `userId: ${authContext.userId}` : 'missing')

	if (!authContext) {
		console.log('ERROR: no auth context')
		return c.json({ error: 'unauthorized' }, 401)
	}

	// читаем RAW body
	const rawBody = await c.req.text()
	console.log('RAW BODY (text):', rawBody)
	console.log('RAW BODY LENGTH:', rawBody.length)

	// парсим json вручную
	let parsed
	try {
		parsed = JSON.parse(rawBody)
		console.log('PARSED JSON:', JSON.stringify(parsed, null, 2))
		console.log('TYPE of parsed:', typeof parsed)
		console.log('parsed.type:', parsed.type, typeof parsed.type)
		console.log('parsed.paymentData:', parsed.paymentData, typeof parsed.paymentData)
	} catch (e) {
		console.log('JSON PARSE ERROR:', e)
		return c.json({ error: 'invalid json' }, 400)
	}

	// проверяем что есть нужные поля
	if (!parsed.type) {
		console.log('ERROR: type is missing')
		return c.json({ error: 'type is required' }, 400)
	}

	if (!parsed.paymentData) {
		console.log('ERROR: paymentData is missing')
		return c.json({ error: 'paymentData is required' }, 400)
	}

	// пробуем создать
	const userId = authContext.userId
	const splitsService = c.get('services').splits

	console.log('CREATING payment method...')
	console.log('userId:', userId)
	console.log('dto:', parsed)

	try {
		const paymentMethod = await splitsService.createPaymentMethod(userId, parsed)

		console.log('SUCCESS! Created payment method:', paymentMethod.id)

		return c.json({
			success: true,
			data: paymentMethod,
		}, 201)
	} catch (error) {
		console.log('ERROR creating payment method:', error)
		return c.json({
			success: false,
			error: error instanceof Error ? error.message : 'unknown error'
		}, 500)
	}
})

/**
 * PATCH /payment-methods/:id - обновить метод оплаты
 */
paymentMethodsRoutes.patch(
	'/:id',
	zValidator('json', updatePaymentMethodSchema),
	async c => {
		const authContext = c.get('authContext')
		if (!authContext) {
			return c.json({ error: 'unauthorized' }, 401)
		}

		const userId = authContext.userId
		const splitsService = c.get('services').splits
		const paymentMethodId = c.req.param('id')
		const dto = c.req.valid('json')

		const updated = await splitsService.updatePaymentMethod(
			paymentMethodId,
			userId,
			dto,
		)

		return c.json({
			success: true,
			data: updated,
		})
	},
)

/**
 * DELETE /payment-methods/:id - удалить метод оплаты
 */
paymentMethodsRoutes.delete('/:id', async c => {
	const authContext = c.get('authContext')
	if (!authContext) {
		return c.json({ error: 'unauthorized' }, 401)
	}

	const userId = authContext.userId
	const splitsService = c.get('services').splits
	const paymentMethodId = c.req.param('id')

	await splitsService.deletePaymentMethod(paymentMethodId, userId)

	return c.json({
		success: true,
		message: 'payment method deleted',
	})
})

/**
 * GET /splits/:id/payment-methods - получить методы оплаты сплита
 */
export const splitPaymentMethodsRoutes = new Hono()

splitPaymentMethodsRoutes.get('/:id/payment-methods', async c => {
	const authContext = c.get('authContext')
	if (!authContext) {
		return c.json({ error: 'unauthorized' }, 401)
	}

	const userId = authContext.userId
	const splitsService = c.get('services').splits
	const splitId = c.req.param('id')

	const methods = await splitsService.getSplitPaymentMethods(splitId, userId)

	return c.json({
		success: true,
		data: methods,
	})
})

/**
 * POST /splits/:id/payment-methods - добавить метод оплаты к сплиту
 */
splitPaymentMethodsRoutes.post(
	'/:id/payment-methods',
	zValidator('json', addPaymentMethodToSplitSchema),
	async c => {
		const authContext = c.get('authContext')
		if (!authContext) {
			return c.json({ error: 'unauthorized' }, 401)
		}

		const userId = authContext.userId
		const splitsService = c.get('services').splits
		const splitId = c.req.param('id')
		const dto = c.req.valid('json')

		await splitsService.addPaymentMethodToSplit(splitId, userId, dto)

		return c.json(
			{
				success: true,
				message: 'payment method added to split',
			},
			201,
		)
	},
)

/**
 * DELETE /splits/:id/payment-methods/:paymentMethodId - удалить метод из сплита
 */
splitPaymentMethodsRoutes.delete(
	'/:id/payment-methods/:paymentMethodId',
	async c => {
		const authContext = c.get('authContext')
		if (!authContext) {
			return c.json({ error: 'unauthorized' }, 401)
		}

		const userId = authContext.userId
		const splitsService = c.get('services').splits
		const splitId = c.req.param('id')
		const paymentMethodId = c.req.param('paymentMethodId')

		await splitsService.removePaymentMethodFromSplit(
			splitId,
			paymentMethodId,
			userId,
		)

		return c.json({
			success: true,
			message: 'payment method removed from split',
		})
	},
)