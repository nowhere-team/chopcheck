import { describe, expect, test } from 'bun:test'

import { baseURL, owner, participant1, participant2 } from './index'

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
	describe('Complete Split Flow', () => {
		test('should create split, add items, divide, and calculate', async () => {
			const createResponse = await fetch(`${baseURL}/splits`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${owner.token}`,
				},
				body: JSON.stringify({
					name: `Test Split ${Date.now()}`,
					currency: 'RUB',
					items: [
						{
							name: 'Pizza',
							price: 1200,
							type: 'product',
							quantity: '1',
							defaultDivisionMethod: 'equal',
						},
						{
							name: 'Cola',
							price: 300,
							type: 'product',
							quantity: '2',
							defaultDivisionMethod: 'equal',
						},
					],
				}),
			})

			expect(createResponse.ok).toBe(true)
			const split = (await createResponse.json()) as SplitResponse
			expect(split.split).toBeDefined()
			expect(split.split.id).toBeDefined()
			expect(split.items).toHaveLength(2)

			const splitId = split.split.id

			const publishResponse = await fetch(`${baseURL}/splits/${splitId}/publish`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${owner.token}`,
				},
			})

			expect(publishResponse.ok).toBe(true)

			const join1Response = await fetch(
				`${baseURL}/splits/${splitId}/join?anonymous=false&display_name=Participant1`,
				{
					method: 'GET',
					headers: {
						Authorization: `Bearer ${participant1.token}`,
					},
				},
			)

			expect(join1Response.ok).toBe(true)
			const joinData1 = (await join1Response.json()) as SplitResponse

			const join2Response = await fetch(
				`${baseURL}/splits/${splitId}/join?anonymous=false&display_name=Participant2`,
				{
					method: 'GET',
					headers: {
						Authorization: `Bearer ${participant2.token}`,
					},
				},
			)

			expect(join2Response.ok).toBe(true)
			const joinData2 = (await join2Response.json()) as SplitResponse

			expect(joinData1.participants).toHaveLength(2)
			expect(joinData2.participants).toHaveLength(3)

			const getSplitResponse = await fetch(`${baseURL}/splits/${splitId}`, {
				headers: {
					Authorization: `Bearer ${owner.token}`,
				},
			})

			expect(getSplitResponse.ok).toBe(true)
			const splitWithParticipants = (await getSplitResponse.json()) as SplitResponse

			const pizzaItem = splitWithParticipants.items.find(i => i.name === 'Pizza')
			const colaItem = splitWithParticipants.items.find(i => i.name === 'Cola')

			expect(pizzaItem).toBeDefined()
			expect(colaItem).toBeDefined()

			const select1Response = await fetch(`${baseURL}/splits/${splitId}/select`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${participant1.token}`,
				},
				body: JSON.stringify({
					selections: [
						{
							itemId: pizzaItem!.id,
							divisionMethod: 'equal',
						},
						{
							itemId: colaItem!.id,
							divisionMethod: 'equal',
						},
					],
				}),
			})

			expect(select1Response.ok).toBe(true)

			const select2Response = await fetch(`${baseURL}/splits/${splitId}/select`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${participant2.token}`,
				},
				body: JSON.stringify({
					selections: [
						{
							itemId: pizzaItem!.id,
							divisionMethod: 'equal',
						},
					],
				}),
			})

			expect(select2Response.ok).toBe(true)

			const ownerSelectResponse = await fetch(`${baseURL}/splits/${splitId}/select`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${owner.token}`,
				},
				body: JSON.stringify({
					selections: [
						{
							itemId: pizzaItem!.id,
							divisionMethod: 'equal',
						},
						{
							itemId: colaItem!.id,
							divisionMethod: 'equal',
						},
					],
				}),
			})

			expect(ownerSelectResponse.ok).toBe(true)

			const finalSplitResponse = await fetch(`${baseURL}/splits/${splitId}`, {
				headers: {
					Authorization: `Bearer ${owner.token}`,
				},
			})

			expect(finalSplitResponse.ok).toBe(true)
			const finalSplit = (await finalSplitResponse.json()) as SplitResponse

			expect(finalSplit.calculations).toBeDefined()
			expect(finalSplit.calculations!.participants).toHaveLength(3)
			expect(finalSplit.calculations!.totals).toBeDefined()

			const ownerCalc = finalSplit.calculations!.participants.find(
				p => p.participantId === splitWithParticipants.participants.find(pp => pp.userId === owner.userId)?.id,
			)
			const p1Calc = finalSplit.calculations!.participants.find(
				p => p.participantId === joinData1.participants.find(pp => pp.userId === participant1.userId)?.id,
			)
			const p2Calc = finalSplit.calculations!.participants.find(
				p => p.participantId === joinData2.participants.find(pp => pp.userId === participant2.userId)?.id,
			)

			expect(ownerCalc?.totalFinal).toBe(550)
			expect(p1Calc?.totalFinal).toBe(550)
			expect(p2Calc?.totalFinal).toBe(400)

			expect(finalSplit.calculations!.totals.splitAmount).toBe(1500)
		}, 60000)

		test('should be idempotent - second run should work', async () => {
			const createResponse = await fetch(`${baseURL}/splits`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${owner.token}`,
				},
				body: JSON.stringify({
					name: `Idempotent Split ${Date.now()}`,
					currency: 'RUB',
					items: [
						{
							name: 'Burger',
							price: 500,
							type: 'product',
							quantity: '1',
							defaultDivisionMethod: 'equal',
						},
					],
				}),
			})

			expect(createResponse.ok).toBe(true)
			const split = (await createResponse.json()) as SplitResponse
			expect(split.split.id).toBeDefined()
		})
	})

	describe('Additional Items Management', () => {
		test('should add items to existing split', async () => {
			const createResponse = await fetch(`${baseURL}/splits`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${owner.token}`,
				},
				body: JSON.stringify({
					name: `Items Test Split ${Date.now()}`,
					currency: 'RUB',
				}),
			})

			expect(createResponse.ok).toBe(true)
			const split = (await createResponse.json()) as SplitResponse
			const splitId = split.split.id

			const addItemsResponse = await fetch(`${baseURL}/splits/${splitId}/items`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${owner.token}`,
				},
				body: JSON.stringify({
					items: [
						{
							name: 'Coffee',
							price: 200,
							type: 'product',
							quantity: '1',
							defaultDivisionMethod: 'equal',
						},
						{
							name: 'Cake',
							price: 350,
							type: 'product',
							quantity: '1',
							defaultDivisionMethod: 'equal',
						},
					],
				}),
			})

			expect(addItemsResponse.ok).toBe(true)
			const updatedSplit = (await addItemsResponse.json()) as SplitResponse
			expect(updatedSplit.items).toHaveLength(2)
		})

		test('should update and delete items', async () => {
			const createResponse = await fetch(`${baseURL}/splits`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${owner.token}`,
				},
				body: JSON.stringify({
					name: `Update Delete Split ${Date.now()}`,
					currency: 'RUB',
					items: [
						{
							name: 'Original Item',
							price: 100,
							type: 'product',
							quantity: '1',
							defaultDivisionMethod: 'equal',
						},
					],
				}),
			})

			const split = (await createResponse.json()) as SplitResponse
			const splitId = split.split.id
			const itemId = split.items[0]?.id

			expect(itemId).toBeDefined()

			const updateResponse = await fetch(`${baseURL}/splits/${splitId}/items/${itemId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${owner.token}`,
				},
				body: JSON.stringify({
					name: 'Updated Item',
					price: 150,
				}),
			})

			expect(updateResponse.ok).toBe(true)
			const updatedSplit = (await updateResponse.json()) as SplitResponse
			const updatedItem = updatedSplit.items.find(i => i.id === itemId)

			expect(updatedItem).toBeDefined()
			expect(updatedItem!.name).toBe('Updated Item')
			expect(updatedItem!.price).toBe(150)

			const deleteResponse = await fetch(`${baseURL}/splits/${splitId}/items/${itemId}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${owner.token}`,
				},
			})

			expect(deleteResponse.ok).toBe(true)
			const finalSplit = (await deleteResponse.json()) as SplitResponse
			expect(finalSplit.items).toHaveLength(0)
		})
	})

	describe('Division Methods', () => {
		test('should handle shares division method', async () => {
			const createResponse = await fetch(`${baseURL}/splits`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${owner.token}`,
				},
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

			const split = (await createResponse.json()) as SplitResponse
			const splitId = split.split.id
			const itemId = split.items[0]?.id

			expect(itemId).toBeDefined()

			await fetch(`${baseURL}/splits/${splitId}/publish`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${owner.token}` },
			})

			await fetch(`${baseURL}/splits/${splitId}/join?anonymous=false`, {
				headers: { Authorization: `Bearer ${participant1.token}` },
			})

			await fetch(`${baseURL}/splits/${splitId}/join?anonymous=false`, {
				headers: { Authorization: `Bearer ${participant2.token}` },
			})

			await fetch(`${baseURL}/splits/${splitId}/select`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${owner.token}`,
				},
				body: JSON.stringify({
					selections: [{ itemId: itemId!, divisionMethod: 'shares', value: '2' }],
				}),
			})

			await fetch(`${baseURL}/splits/${splitId}/select`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${participant1.token}`,
				},
				body: JSON.stringify({
					selections: [{ itemId: itemId!, divisionMethod: 'shares', value: '1' }],
				}),
			})

			const finalResponse = await fetch(`${baseURL}/splits/${splitId}`, {
				headers: { Authorization: `Bearer ${owner.token}` },
			})

			const finalSplit = (await finalResponse.json()) as SplitResponse
			expect(finalSplit.calculations).toBeDefined()

			const ownerCalc = finalSplit.calculations!.participants.find(p =>
				finalSplit.participants.find(pp => pp.userId === owner.userId && pp.id === p.participantId),
			)
			const p1Calc = finalSplit.calculations!.participants.find(p =>
				finalSplit.participants.find(pp => pp.userId === participant1.userId && pp.id === p.participantId),
			)

			expect(ownerCalc?.totalFinal).toBe(2000)
			expect(p1Calc?.totalFinal).toBe(1000)
		})

		test('should handle fixed division method', async () => {
			const createResponse = await fetch(`${baseURL}/splits`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${owner.token}`,
				},
				body: JSON.stringify({
					name: `Fixed Split ${Date.now()}`,
					currency: 'RUB',
					items: [
						{
							name: 'Shared Meal',
							price: 1000,
							type: 'product',
							quantity: '1',
							defaultDivisionMethod: 'fixed',
						},
					],
				}),
			})

			const split = (await createResponse.json()) as SplitResponse
			const splitId = split.split.id
			const itemId = split.items[0]?.id

			expect(itemId).toBeDefined()

			await fetch(`${baseURL}/splits/${splitId}/publish`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${owner.token}` },
			})

			await fetch(`${baseURL}/splits/${splitId}/join?anonymous=false`, {
				headers: { Authorization: `Bearer ${participant1.token}` },
			})

			await fetch(`${baseURL}/splits/${splitId}/select`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${owner.token}`,
				},
				body: JSON.stringify({
					selections: [{ itemId: itemId!, divisionMethod: 'fixed', value: '600' }],
				}),
			})

			await fetch(`${baseURL}/splits/${splitId}/select`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${participant1.token}`,
				},
				body: JSON.stringify({
					selections: [{ itemId: itemId!, divisionMethod: 'fixed', value: '400' }],
				}),
			})

			const finalResponse = await fetch(`${baseURL}/splits/${splitId}`, {
				headers: { Authorization: `Bearer ${owner.token}` },
			})

			const finalSplit = (await finalResponse.json()) as SplitResponse
			expect(finalSplit.calculations).toBeDefined()

			const ownerCalc = finalSplit.calculations!.participants.find(p =>
				finalSplit.participants.find(pp => pp.userId === owner.userId && pp.id === p.participantId),
			)
			const p1Calc = finalSplit.calculations!.participants.find(p =>
				finalSplit.participants.find(pp => pp.userId === participant1.userId && pp.id === p.participantId),
			)

			expect(ownerCalc?.totalFinal).toBe(600)
			expect(p1Calc?.totalFinal).toBe(400)
		})
	})

	describe('Split List Management', () => {
		test('should get my splits list', async () => {
			await fetch(`${baseURL}/splits`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${owner.token}`,
				},
				body: JSON.stringify({
					name: `My Split 1 ${Date.now()}`,
					currency: 'RUB',
				}),
			})

			await fetch(`${baseURL}/splits`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${owner.token}`,
				},
				body: JSON.stringify({
					name: `My Split 2 ${Date.now()}`,
					currency: 'RUB',
				}),
			})

			const response = await fetch(`${baseURL}/splits/my?limit=10&offset=0`, {
				headers: { Authorization: `Bearer ${owner.token}` },
			})

			expect(response.ok).toBe(true)
			const data = (await response.json()) as { splits: any[]; pagination: any }

			expect(data.splits).toBeDefined()
			expect(data.splits.length).toBeGreaterThanOrEqual(2)
			expect(data.pagination).toBeDefined()
			expect(data.pagination.limit).toBe(10)
			expect(data.pagination.offset).toBe(0)
		})

		test('should get grouped splits', async () => {
			const response = await fetch(`${baseURL}/splits/my?grouped=true`, {
				headers: { Authorization: `Bearer ${owner.token}` },
			})

			expect(response.ok).toBe(true)
			const data = await response.json()

			expect(data).toBeDefined()
		})

		test('should get split by shortId', async () => {
			const createResponse = await fetch(`${baseURL}/splits`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${owner.token}`,
				},
				body: JSON.stringify({
					name: `ShortId Split ${Date.now()}`,
					currency: 'RUB',
				}),
			})

			const split = (await createResponse.json()) as SplitResponse
			const splitId = split.split.id

			await fetch(`${baseURL}/splits/${splitId}/publish`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${owner.token}` },
			})

			const updatedResponse = await fetch(`${baseURL}/splits/${splitId}`, {
				headers: { Authorization: `Bearer ${owner.token}` },
			})

			const updatedSplit = (await updatedResponse.json()) as SplitResponse
			const shortId = updatedSplit.split.shortId

			expect(shortId).toBeDefined()

			const byShortIdResponse = await fetch(`${baseURL}/splits/s/${shortId}`, {
				headers: { Authorization: `Bearer ${owner.token}` },
			})

			expect(byShortIdResponse.ok).toBe(true)
			const byShortIdSplit = (await byShortIdResponse.json()) as SplitResponse
			expect(byShortIdSplit.split.id).toBe(splitId)
		})
	})

	describe('Error Handling & Authorization', () => {
		test('should fail without authorization token', async () => {
			const response = await fetch(`${baseURL}/splits`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: 'Unauthorized Split',
					currency: 'RUB',
				}),
			})

			expect(response.ok).toBe(false)
			expect(response.status).toBe(401)
		})

		test('should fail with invalid token', async () => {
			const response = await fetch(`${baseURL}/splits`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer invalid-token-12345',
				},
				body: JSON.stringify({
					name: 'Invalid Token Split',
					currency: 'RUB',
				}),
			})

			expect(response.ok).toBe(false)
			expect(response.status).toBe(401)
		})

		test('should fail when accessing non-existent split', async () => {
			const fakeId = '00000000-0000-0000-0000-000000000000'
			const response = await fetch(`${baseURL}/splits/${fakeId}`, {
				headers: {
					Authorization: `Bearer ${owner.token}`,
				},
			})

			expect(response.ok).toBe(false)
			expect(response.status).toBe(404)
		})

		test('should fail with invalid split data', async () => {
			const response = await fetch(`${baseURL}/splits`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${owner.token}`,
				},
				body: JSON.stringify({
					currency: 'RUB',
				}),
			})

			expect(response.ok).toBe(false)
			expect(response.status).toBe(400)
		})

		test('should fail when non-owner tries to publish split', async () => {
			const createResponse = await fetch(`${baseURL}/splits`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${owner.token}`,
				},
				body: JSON.stringify({
					name: `Protected Split ${Date.now()}`,
					currency: 'RUB',
				}),
			})

			const split = (await createResponse.json()) as SplitResponse
			const splitId = split.split.id

			const publishResponse = await fetch(`${baseURL}/splits/${splitId}/publish`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${participant1.token}`,
				},
			})

			expect(publishResponse.ok).toBe(false)
			expect([403, 404]).toContain(publishResponse.status)
		})

		test('should handle invalid UUID format', async () => {
			const response = await fetch(`${baseURL}/splits/not-a-valid-uuid`, {
				headers: {
					Authorization: `Bearer ${owner.token}`,
				},
			})

			expect(response.ok).toBe(false)
			expect(response.status).toBe(400)
		})
	})
})
