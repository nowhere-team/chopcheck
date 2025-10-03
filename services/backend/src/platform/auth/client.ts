import { decode, type JwtVariables, sign, verify } from 'hono/jwt'
import ky, { type KyInstance } from 'ky'

import type { Cache } from '@/platform/cache'
import type { Logger } from '@/platform/logger'

import type {
	AuthConfig,
	AuthContext,
	CreateTokenRequest,
	CreateTokenResponse,
	CreateUserRequest,
	CreateUserResponse,
	IntegrationType,
	JwtClaims,
} from './types'

export class AuthClient {
	private readonly api?: KyInstance

	constructor(
		private readonly logger: Logger,
		private readonly cache: Cache,
		private readonly config: AuthConfig,
	) {
		if (!config.devMode) {
			if (!config.serviceUrl) {
				throw new Error('auth service url is required in production mode')
			}

			this.api = ky.create({
				prefixUrl: this.config.serviceUrl,
				timeout: this.config.serviceTimeout,
				retry: {
					limit: 2,
					methods: ['get', 'post'],
					statusCodes: [408, 413, 429, 500, 502, 503, 504],
				},
				hooks: {
					beforeRequest: [
						request => {
							this.logger.debug('auth service request', {
								url: request.url,
								method: request.method,
							})
						},
					],
					beforeError: [
						error => {
							const { request, response } = error
							this.logger.warn('auth service error', {
								url: request.url,
								method: request.method,
								status: response?.status,
								statusText: response?.statusText,
							})
							return error
						},
					],
					afterResponse: [
						(_request, _options, response) => {
							this.logger.debug('auth service response', {
								status: response.status,
								ok: response.ok,
							})
						},
					],
				},
			})
		}
	}

	async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
		if (this.config.devMode) {
			return this.mockCreateUser(request)
		}

		return await this.api!.post('internal/users', { json: request }).json<CreateUserResponse>()
	}

	async findUserByIntegration(type: IntegrationType, externalId: string): Promise<CreateUserResponse | null> {
		if (this.config.devMode) {
			return this.mockFindUser(type, externalId)
		}

		try {
			return await this.api!.get(`internal/users/by-integration/${type}/${externalId}`).json<CreateUserResponse>()
		} catch (error) {
			if (error instanceof Error && 'response' in error) {
				const response = (error as { response: Response }).response
				if (response.status === 404) {
					return null
				}
			}
			throw error
		}
	}

	async createToken(request: CreateTokenRequest): Promise<CreateTokenResponse> {
		if (this.config.devMode) {
			return this.mockCreateToken(request)
		}

		return await this.api!.post('internal/tokens', { json: request }).json<CreateTokenResponse>()
	}

	async revokeToken(jti: string, reason?: string): Promise<void> {
		if (this.config.devMode) {
			await this.mockRevokeToken(jti)
			return
		}

		await this.api!.delete(`internal/tokens/${jti}`, { json: { reason } })
	}

	extractTokenFromHeader(authHeader?: string): string {
		if (!authHeader) {
			throw new Error('authorization header is missing')
		}

		const parts = authHeader.split(' ')
		if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer') {
			throw new Error('invalid authorization header format')
		}

		return parts[1]!
	}

	async validateToken(token: string): Promise<AuthContext> {
		const { payload } = decode(token)
		const claims = payload as unknown as JwtClaims

		this.validateBasicClaims(claims)

		if (!this.config.devMode) {
			try {
				await verify(token, this.config.jwtSecret, 'HS256')
				this.logger.debug('jwt signature verified', { jti: claims.jti })
			} catch (error) {
				this.logger.warn('jwt signature verification failed', { error })
				throw new Error('invalid jwt signature')
			}
		}

		const isBlocked = await this.cache.exists(`blocked_token:${claims.jti}`)
		if (isBlocked) {
			throw new Error('token has been revoked')
		}

		return {
			userId: claims.sub,
			tokenId: claims.jti,
			permissions: new Set(claims.permissions),
			requestedBy: claims.requested_by,
		}
	}

	private validateBasicClaims(claims: JwtClaims): void {
		const now = Math.floor(Date.now() / 1000)

		if (!claims.sub || !claims.jti) {
			throw new Error('jwt missing required claims')
		}

		if (claims.exp && claims.exp < now) {
			throw new Error('jwt token has expired')
		}

		if (claims.iss !== this.config.jwtIssuer) {
			throw new Error(`jwt issuer mismatch: expected ${this.config.jwtIssuer}, got ${claims.iss}`)
		}

		if (!claims.aud.includes(this.config.jwtAudience)) {
			throw new Error(`jwt audience mismatch: expected ${this.config.jwtAudience}`)
		}
	}

	// -- mocking for dev mode --

	private devUsers = new Map<string, CreateUserResponse>()

	private mockCreateUser(request: CreateUserRequest): CreateUserResponse {
		const telegramIntegration = request.integrations.find(i => i.type === 'telegram')
		if (!telegramIntegration) {
			throw new Error('telegram integration is required')
		}

		const userId = crypto.randomUUID()
		const user: CreateUserResponse = {
			user_id: userId,
			display_name: request.custom_display_name || telegramIntegration.external_data.first_name || 'unknown user',
			username: request.custom_username || telegramIntegration.external_data.username,
			avatar_url: request.custom_avatar_url || telegramIntegration.external_data.photo_url,
			metadata: {},
		}

		this.devUsers.set(`telegram:${telegramIntegration.external_id}`, user)
		this.logger.debug('mock user created', { userId, externalId: telegramIntegration.external_id })

		return user
	}

	private mockFindUser(type: IntegrationType, externalId: string): CreateUserResponse | null {
		const user = this.devUsers.get(`${type}:${externalId}`)
		return user || null
	}

	private async mockCreateToken(request: CreateTokenRequest): Promise<CreateTokenResponse> {
		const now = Math.floor(Date.now() / 1000)
		const exp = now + (request.ttl_seconds || 86400)
		const jti = crypto.randomUUID()

		const payload: JwtVariables['jwtPayload'] & JwtClaims = {
			iss: this.config.jwtIssuer,
			aud: [this.config.jwtAudience],
			sub: request.user_id,
			jti,
			exp,
			iat: now,
			requested_by: request.requested_by,
			permissions: request.permissions,
			user_status: 'active',
		}

		const token = await sign(payload as JwtVariables['jwtPayload'], this.config.jwtSecret, 'HS256')

		this.logger.debug('mock token created', { userId: request.user_id, jti })

		return {
			access_token: token,
			expires_at: new Date(exp * 1000).toISOString(),
			jti,
		}
	}

	private async mockRevokeToken(jti: string): Promise<void> {
		await this.cache.set(`blocked_token:${jti}`, true, 86400)
		this.logger.debug('mock token revoked', { jti })
	}
}
