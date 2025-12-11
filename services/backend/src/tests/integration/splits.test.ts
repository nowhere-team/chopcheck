import { afterAll, beforeAll, describe, expect, test } from 'bun:test'

import { authHeaders, createTestUser, type TestUser } from './helpers'
import { createTestContext, type TestContext } from './setup'

interface SplitItem {
	id: string
	name: string
	price: number
	type: string
	quantity: string
	defaultDivisionMethod: string
}

interface Participant {
	id: string
	userId: string | null
	displayName: string
	isAnonymous: boolean
}

interface SplitResponse {
	split: {
		id: string
		name: string
		currency: string
		status: string
		shortId?: string
	}
	items: SplitItem[]
	participants: Participant[]
	calculations?: {
		participants: Array<{
			participantId: string
			displayName: string
			totalBase: number
			totalDiscount: number
			totalFinal: number
		}>
		totals: {
			splitAmount: number
			collected: number
			difference: number
		}
	}
}

describe('Splits Integration Tests', () => {
	let ctx: TestContext
	let owner: TestUser
	let participant1: TestUser
	let participant2: TestUser

	beforeAll(async () => {
		ctx = await createTestContext()

		owner = await createTestUser(ctx.app, 'owner')
		participant1 = await createTestUser(ctx.app, 'p1')
		participant2 = await createTestUser(ctx.app, 'p2')
	})

	afterAll(async () => {
		await ctx?.cleanup()
	})

	describe('Complete Split Flow', () => {
		test('should create split, add items, divide, and calculate', async () => {
			const { app } = ctx

			// create split with items
			const createRes = await app.request('/api/splits', {
				method: 'POST',
				headers: authHeaders(owner.token),
				body: JSON.stringify({
					name: `Test Split ${Date.now()}`,
					currency: 'RUB',
					items: [
						{ name: 'Pizza', price: 1200, type: 'product', quantity: '1', defaultDivisionMethod: 'equal' },
						{ name: 'Cola', price: 300, type: 'product', quantity: '2', defaultDivisionMethod: 'equal' },
					],
				}),
			})

			expect(createRes.ok).toBe(true)
			const split = (await createRes.json()) as SplitResponse
			expect(split.split.id).toBeDefined()
			expect(split.items).toHaveLength(2)

			const splitId = split.split.id

			// publish split
			const publishRes = await app.request(`/api/splits/${splitId}/publish`, {
				method: 'POST',
				headers: authHeaders(owner.token),
			})
			expect(publishRes.ok).toBe(true)

			// participants join
			const join1Res = await app.request(
				`/api/splits/${splitId}/join?anonymous=false&display_name=Participant1`,
				{ headers: authHeaders(participant1.token) },
			)
			expect(join1Res.ok).toBe(true)

			const join2Res = await app.request(
				`/api/splits/${splitId}/join?anonymous=false&display_name=Participant2`,
				{ headers: authHeaders(participant2.token) },
			)
			expect(join2Res.ok).toBe(true)

			// fetch updated split with participants
			const getRes = await app.request(`/api/splits/${splitId}`, {
				headers: authHeaders(owner.token),
			})
			const updated = (await getRes.json()) as SplitResponse

			const pizzaItem = updated.items.find(i => i.name === 'Pizza')!
			const colaItem = updated.items.find(i => i.name === 'Cola')!

			// participants select items
			// participant1: pizza + cola
			await app.request(`/api/splits/${splitId}/select`, {
				method: 'POST',
				headers: authHeaders(participant1.token),
				body: JSON.stringify({
					selections: [
						{ itemId: pizzaItem.id, divisionMethod: 'equal' },
						{ itemId: colaItem.id, divisionMethod: 'equal' },
					],
				}),
			})

			// participant2: pizza only
			await app.request(`/api/splits/${splitId}/select`, {
				method: 'POST',
				headers: authHeaders(participant2.token),
				body: JSON.stringify({
					selections: [{ itemId: pizzaItem.id, divisionMethod: 'equal' }],
				}),
			})

			// owner: pizza + cola
			await app.request(`/api/splits/${splitId}/select`, {
				method: 'POST',
				headers: authHeaders(owner.token),
				body: JSON.stringify({
					selections: [
						{ itemId: pizzaItem.id, divisionMethod: 'equal' },
						{ itemId: colaItem.id, divisionMethod: 'equal' },
					],
				}),
			})

			// verify calculations
			const finalRes = await app.request(`/api/splits/${splitId}`, {
				headers: authHeaders(owner.token),
			})
			const finalSplit = (await finalRes.json()) as SplitResponse

			expect(finalSplit.calculations).toBeDefined()
			expect(finalSplit.calculations!.participants).toHaveLength(3)

			// pizza: 1200 / 3 = 400
			// cola: 300 / 2 = 150
			// owner: 400 + 150 = 550
			// p1: 400 + 150 = 550
			// p2: 400
			const ownerParticipant = finalSplit.participants.find(p => p.userId === owner.userId)!
			const ownerCalc = finalSplit.calculations!.participants.find(c => c.participantId === ownerParticipant.id)!
			expect(ownerCalc.totalFinal).toBe(550)

			expect(finalSplit.calculations!.totals.splitAmount).toBe(1500)
		})

		test('should handle shares division method', async () => {
			const { app } = ctx

			const createRes = await app.request('/api/splits', {
				method: 'POST',
				headers: authHeaders(owner.token),
				body: JSON.stringify({
					name: `Shares Split ${Date.now()}`,
					currency: 'RUB',
					items: [
						{
							name: 'Expensive Wine',
							price: 3000,
							type: 'product',
							quantity: '1',
							defaultDivisionMethod: 'shares',
						},
					],
				}),
			})

			const split = (await createRes.json()) as SplitResponse
			const splitId = split.split.id
			const itemId = split.items[0]!.id

			await app.request(`/api/splits/${splitId}/publish`, {
				method: 'POST',
				headers: authHeaders(owner.token),
			})

			await app.request(`/api/splits/${splitId}/join`, {
				headers: authHeaders(participant1.token),
			})

			// owner takes 2 shares, participant1 takes 1 share
			await app.request(`/api/splits/${splitId}/select`, {
				method: 'POST',
				headers: authHeaders(owner.token),
				body: JSON.stringify({
					selections: [{ itemId, divisionMethod: 'shares', value: '2' }],
				}),
			})

			await app.request(`/api/splits/${splitId}/select`, {
				method: 'POST',
				headers: authHeaders(participant1.token),
				body: JSON.stringify({
					selections: [{ itemId, divisionMethod: 'shares', value: '1' }],
				}),
			})

			const finalRes = await app.request(`/api/splits/${splitId}`, {
				headers: authHeaders(owner.token),
			})
			const finalSplit = (await finalRes.json()) as SplitResponse

			// 3000 / 3 shares = 1000 per share
			// owner: 2 * 1000 = 2000
			// p1: 1 * 1000 = 1000
			const ownerParticipant = finalSplit.participants.find(p => p.userId === owner.userId)!
			const ownerCalc = finalSplit.calculations!.participants.find(c => c.participantId === ownerParticipant.id)!
			expect(ownerCalc.totalFinal).toBe(2000)

			const p1Participant = finalSplit.participants.find(p => p.userId === participant1.userId)!
			const p1Calc = finalSplit.calculations!.participants.find(c => c.participantId === p1Participant.id)!
			expect(p1Calc.totalFinal).toBe(1000)
		})
	})

	describe('Items Management', () => {
		test('should add, update, and delete items', async () => {
			const { app } = ctx

			// create empty split
			const createRes = await app.request('/api/splits', {
				method: 'POST',
				headers: authHeaders(owner.token),
				body: JSON.stringify({ name: `Items Test ${Date.now()}`, currency: 'RUB' }),
			})
			const split = (await createRes.json()) as SplitResponse
			const splitId = split.split.id

			// add items
			const addRes = await app.request(`/api/splits/${splitId}/items`, {
				method: 'POST',
				headers: authHeaders(owner.token),
				body: JSON.stringify({
					items: [
						{ name: 'Coffee', price: 200, type: 'product', quantity: '1', defaultDivisionMethod: 'equal' },
						{ name: 'Cake', price: 350, type: 'product', quantity: '1', defaultDivisionMethod: 'equal' },
					],
				}),
			})
			expect(addRes.ok).toBe(true)
			const afterAdd = (await addRes.json()) as SplitResponse
			expect(afterAdd.items).toHaveLength(2)

			const coffeeItem = afterAdd.items.find(i => i.name === 'Coffee')!

			// update item
			const updateRes = await app.request(`/api/splits/${splitId}/items/${coffeeItem.id}`, {
				method: 'PATCH',
				headers: authHeaders(owner.token),
				body: JSON.stringify({ name: 'Espresso', price: 250 }),
			})
			expect(updateRes.ok).toBe(true)
			const afterUpdate = (await updateRes.json()) as SplitResponse
			const updatedItem = afterUpdate.items.find(i => i.id === coffeeItem.id)!
			expect(updatedItem.name).toBe('Espresso')
			expect(updatedItem.price).toBe(250)

			// delete item
			const deleteRes = await app.request(`/api/splits/${splitId}/items/${coffeeItem.id}`, {
				method: 'DELETE',
				headers: authHeaders(owner.token),
			})
			expect(deleteRes.ok).toBe(true)
			const afterDelete = (await deleteRes.json()) as SplitResponse
			expect(afterDelete.items).toHaveLength(1)
		})
	})

	describe('Error Handling', () => {
		test('should fail without authorization', async () => {
			const res = await ctx.app.request('/api/splits', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: 'Test', currency: 'RUB' }),
			})
			expect(res.status).toBe(401)
		})

		test('should fail with invalid token', async () => {
			const res = await ctx.app.request('/api/splits', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer invalid-token',
				},
				body: JSON.stringify({ name: 'Test', currency: 'RUB' }),
			})
			expect(res.status).toBe(401)
		})

		test('should return 404 for non-existent split', async () => {
			const res = await ctx.app.request('/api/splits/00000000-0000-0000-0000-000000000000', {
				headers: authHeaders(owner.token),
			})
			expect(res.status).toBe(404)
		})

		test('should return 400 for invalid UUID', async () => {
			const res = await ctx.app.request('/api/splits/not-a-uuid', {
				headers: authHeaders(owner.token),
			})
			expect(res.status).toBe(400)
		})

		test('should return 400 for invalid split data', async () => {
			const res = await ctx.app.request('/api/splits', {
				method: 'POST',
				headers: authHeaders(owner.token),
				body: JSON.stringify({ currency: 'RUB' }), // missing name field
			})
			expect(res.status).toBe(400)
		})

		test('should forbid non-owner from publishing', async () => {
			const createRes = await ctx.app.request('/api/splits', {
				method: 'POST',
				headers: authHeaders(owner.token),
				body: JSON.stringify({ name: `Protected Split ${Date.now()}`, currency: 'RUB' }),
			})
			const split = (await createRes.json()) as SplitResponse

			// attempt to publish as non-owner
			const publishRes = await ctx.app.request(`/api/splits/${split.split.id}/publish`, {
				method: 'POST',
				headers: authHeaders(participant1.token),
			})
			expect([403, 404]).toContain(publishRes.status)
		})
	})

	describe('Split List', () => {
		test('should list user splits', async () => {
			const { app } = ctx

			await app.request('/api/splits', {
				method: 'POST',
				headers: authHeaders(owner.token),
				body: JSON.stringify({ name: `List Test 1 ${Date.now()}`, currency: 'RUB' }),
			})
			await app.request('/api/splits', {
				method: 'POST',
				headers: authHeaders(owner.token),
				body: JSON.stringify({ name: `List Test 2 ${Date.now()}`, currency: 'RUB' }),
			})

			const res = await app.request('/api/splits/my?limit=10', {
				headers: authHeaders(owner.token),
			})
			expect(res.ok).toBe(true)

			const data = (await res.json()) as { splits: unknown[]; pagination: unknown }
			expect(data.splits.length).toBeGreaterThanOrEqual(2)
		})

		test('should get split by shortId', async () => {
			const { app } = ctx

			const createRes = await app.request('/api/splits', {
				method: 'POST',
				headers: authHeaders(owner.token),
				body: JSON.stringify({
					name: `ShortId Test ${Date.now()}`,
					currency: 'RUB',
					items: [
						{ name: 'Test', price: 100, type: 'product', quantity: '1', defaultDivisionMethod: 'equal' },
					],
				}),
			})
			const split = (await createRes.json()) as SplitResponse

			await app.request(`/api/splits/${split.split.id}/publish`, {
				method: 'POST',
				headers: authHeaders(owner.token),
			})

			// fetch updated split with shortId
			const getRes = await app.request(`/api/splits/${split.split.id}`, {
				headers: authHeaders(owner.token),
			})
			const updated = (await getRes.json()) as SplitResponse
			expect(updated.split.shortId).toBeDefined()

			// fetch by shortId
			const byShortRes = await app.request(`/api/splits/s/${updated.split.shortId}`, {
				headers: authHeaders(owner.token),
			})
			expect(byShortRes.ok).toBe(true)
			const byShort = (await byShortRes.json()) as SplitResponse
			expect(byShort.split.id).toBe(split.split.id)
		})
	})
})
