import { afterAll, beforeAll } from 'bun:test'

import { createTestUser, setupTestApp, teardownTestApp } from './setup'

export let baseURL: string
export let owner: { userId: string; token: string; telegramId: number }
export let participant1: { userId: string; token: string; telegramId: number }
export let participant2: { userId: string; token: string; telegramId: number }

beforeAll(async () => {
	console.log('🚀 Setting up integration test environment...')

	const testEnv = await setupTestApp()
	baseURL = testEnv.baseURL

	owner = await createTestUser(baseURL, 'owner')
	participant1 = await createTestUser(baseURL, 'p1')
	participant2 = await createTestUser(baseURL, 'p2')

	console.log('✅ Integration test environment ready')
	console.log(`   Base URL: ${baseURL}`)
	console.log(`   Owner: ${owner.userId}`)
	console.log(`   Participant1: ${participant1.userId}`)
	console.log(`   Participant2: ${participant2.userId}`)
})

afterAll(async () => {
	console.log('🧹 Cleaning up integration test environment...')
	await teardownTestApp()
	console.log('✅ Integration test environment cleaned up')
})

import './splits.test'
