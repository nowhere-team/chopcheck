export interface ApiRequestOptions extends RequestInit {
	timeout?: number
	skipAuth?: boolean
}

export interface ApiErrorData {
	message: string
	code?: string
	details?: Record<string, unknown>
}

export class ApiError extends Error {
	constructor(
		message: string,
		public status: number,
		public code?: string,
		public details?: Record<string, unknown>
	) {
		super(message)
		this.name = 'ApiError'
	}
}
