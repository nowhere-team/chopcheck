import type { PlatformStorage } from '$lib/platform/types'
import { API_BASE_URL, API_TIMEOUT, STORAGE_KEYS } from '$lib/shared/constants'
import { createLogger } from '$lib/shared/logger'

import { ApiError, type ApiRequestOptions } from './types'

const log = createLogger('api')

export class ApiClient {
	private readonly baseUrl: string
	private storage: PlatformStorage | null = null
	private tokenCache: string | null = null

	constructor(baseUrl: string = API_BASE_URL) {
		this.baseUrl = baseUrl
	}

	setStorage(storage: PlatformStorage): void {
		this.storage = storage
	}

	async setToken(token: string): Promise<void> {
		this.tokenCache = token
		if (this.storage) {
			await this.storage.set(STORAGE_KEYS.AUTH_TOKEN, token)
		}
	}

	async clearToken(): Promise<void> {
		this.tokenCache = null
		if (this.storage) {
			await this.storage.remove(STORAGE_KEYS.AUTH_TOKEN)
		}
	}

	async hasToken(): Promise<boolean> {
		const token = await this.getToken()
		return token !== null
	}

	private async getToken(): Promise<string | null> {
		if (this.tokenCache) return this.tokenCache

		if (this.storage) {
			const result = await this.storage.get(STORAGE_KEYS.AUTH_TOKEN)
			if (result.ok && result.value) {
				this.tokenCache = result.value
				return result.value
			}
		}

		return null
	}

	async request<T>(
		method: string,
		endpoint: string,
		data?: unknown,
		options: ApiRequestOptions = {}
	): Promise<T> {
		const { timeout = API_TIMEOUT, skipAuth = false, ...fetchOptions } = options

		const headers = new Headers(fetchOptions.headers)
		headers.set('Content-Type', 'application/json')

		if (!skipAuth) {
			const token = await this.getToken()
			if (token) {
				headers.set('Authorization', `Bearer ${token}`)
			}
		}

		const url = `${this.baseUrl}/${endpoint}`
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), timeout)

		try {
			log.debug(`${method} ${endpoint}`)

			const response = await fetch(url, {
				method,
				headers,
				body: data ? JSON.stringify(data) : undefined,
				signal: controller.signal,
				...fetchOptions
			})

			clearTimeout(timeoutId)

			if (!response.ok) {
				await this.handleErrorResponse(response)
			}

			const text = await response.text()
			if (!text) return undefined as T

			return JSON.parse(text) as T
		} catch (error) {
			clearTimeout(timeoutId)
			throw this.normalizeError(error)
		}
	}

	private async handleErrorResponse(response: Response): Promise<never> {
		if (response.status === 401) {
			await this.clearToken()
		}

		let errorData: { message?: string; code?: string; details?: Record<string, unknown> } = {}
		try {
			errorData = await response.json()
		} catch {
			// ignore
		}

		throw new ApiError(
			errorData.message || `HTTP ${response.status}`,
			response.status,
			errorData.code,
			errorData.details
		)
	}

	private normalizeError(error: unknown): ApiError {
		if (error instanceof ApiError) return error

		if (error instanceof Error && error.name === 'AbortError') {
			return new ApiError('Request timeout', 408, 'TIMEOUT')
		}

		return new ApiError(
			error instanceof Error ? error.message : 'Unknown error',
			0,
			'NETWORK_ERROR'
		)
	}

	get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
		return this.request<T>('GET', endpoint, undefined, options)
	}

	post<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
		return this.request<T>('POST', endpoint, data, options)
	}

	patch<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
		return this.request<T>('PATCH', endpoint, data, options)
	}

	delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
		return this.request<T>('DELETE', endpoint, undefined, options)
	}
}

export const api = new ApiClient()
