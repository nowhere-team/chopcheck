import type { ApiSpec } from '@/http'

export interface TestUser {
	userId: string
	token: string
	telegramId: number
}

// creates test user via dev endpoint
export async function createTestUser(app: ApiSpec, suffix: string = ''): Promise<TestUser> {
	const telegramId = Math.floor(Math.random() * 1000000000) + Date.now()
	const username = `testuser_${telegramId}${suffix}`

	const response = await app.request('/api/dev/telegram', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			telegram_id: telegramId,
			username,
			first_name: `Test User ${suffix}`,
			photo_url: 'https://example.com/avatar.jpg',
		}),
	})

	if (!response.ok) {
		const error = await response.text()
		throw new Error(`Failed to create test user: ${response.status} ${error}`)
	}

	const data = (await response.json()) as {
		access_token: string
		user: { id: string }
	}

	return {
		userId: data.user.id,
		token: data.access_token,
		telegramId,
	}
}

export function authHeaders(token: string): Record<string, string> {
	return {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`,
	}
}

// typed helper for api requests with auth
export async function apiRequest<T>(
	app: ApiSpec,
	path: string,
	options: {
		method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
		token?: string
		body?: unknown
		query?: Record<string, string>
	} = {},
): Promise<{ status: number; data: T; ok: boolean }> {
	const { method = 'GET', token, body, query } = options

	let url = `/api${path}`
	if (query) {
		const params = new URLSearchParams(query)
		url += `?${params.toString()}`
	}

	const headers: Record<string, string> = {}
	if (token) {
		headers['Authorization'] = `Bearer ${token}`
	}
	if (body) {
		headers['Content-Type'] = 'application/json'
	}

	const response = await app.request(url, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
	})

	const data = (await response.json()) as T

	return {
		status: response.status,
		data,
		ok: response.ok,
	}
}
