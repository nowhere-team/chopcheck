import { start, stop } from '@/bootstrap'

process.env.NODE_ENV = 'development'

let testApp: Awaited<ReturnType<typeof start>> | null = null

export async function setupTestApp() {
	if (testApp) {
		const baseURL = `http://localhost:${testApp.config.PORT}/api`
		return { app: testApp, baseURL }
	}

	testApp = await start()
	const baseURL = `http://localhost:${testApp.config.PORT}/api`

	return { app: testApp, baseURL }
}

export async function teardownTestApp() {
	if (testApp) {
		await stop(testApp)
		testApp = null
	}
}

interface TestUser {
	userId: string
	token: string
	telegramId: number
}

export async function createTestUser(baseURL: string, suffix: string = ''): Promise<TestUser> {
	const telegram_id = Math.floor(Math.random() * 1000000000) + Date.now()
	const username = `testuser_${telegram_id}${suffix}`

	const response = await fetch(`${baseURL}/dev/telegram`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			telegram_id,
			username,
			first_name: `Test User ${suffix}`,
			photo_url: 'https://example.com/avatar.jpg',
		}),
	})

	if (!response.ok) {
		throw new Error(`Failed to create test user: ${response.statusText}`)
	}

	const data = (await response.json()) as { access_token: string; user: { id: string } }
	return {
		userId: data.user.id,
		token: data.access_token,
		telegramId: telegram_id,
	}
}
