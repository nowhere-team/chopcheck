import ky, { type KyInstance, type Options } from 'ky'

import { clearToken, getToken } from '$api/tokens'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

class ApiClient {
	private client: KyInstance
	private cachedToken?: string | null

	constructor() {
		this.client = ky.create({
			prefixUrl: API_URL,
			timeout: 15000,
			retry: {
				limit: 2,
				methods: ['get'],
				statusCodes: [408, 413, 429, 500, 502, 503, 504]
			},
			hooks: {
				beforeRequest: [
					async request => {
						const token = await this.getToken()
						if (token) {
							request.headers.set('authorization', `bearer ${token}`)
						}
					}
				],
				afterResponse: [
					async (_request, _options, response) => {
						if (response.status === 401) {
							await this.clearToken()
							window.location.href = '/'
						}
					}
				]
			}
		})
	}

	private async getToken(): Promise<string | null> {
		if (this.cachedToken) return this.cachedToken
		return (this.cachedToken = await getToken())
	}

	private async clearToken(): Promise<void> {
		await clearToken()
		this.cachedToken = null
	}

	async request<T>(endpoint: string, options?: Options): Promise<T> {
		return await this.client(endpoint, options).json<T>()
	}

	get<T>(endpoint: string, options?: Options): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: 'get' })
	}

	post<T>(endpoint: string, json?: unknown, options?: Options): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: 'post', json })
	}

	patch<T>(endpoint: string, json?: unknown, options?: Options): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: 'patch', json })
	}

	delete<T>(endpoint: string, options?: Options): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: 'delete' })
	}
}

export const api = new ApiClient()
