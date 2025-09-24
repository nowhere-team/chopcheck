import * as crypto from 'node:crypto'
import { randomUUID } from 'node:crypto'

import type { Logger } from '@/platform/logger'

import type {
	AuthConfig,
	AuthContext,
	CreateTokenRequest,
	CreateTokenResponse,
	CreateUserRequest,
	CreateUserResponse,
	JwtClaims,
	TelegramInitData,
} from './types'

export class AuthClient {
	constructor(
		private readonly config: AuthConfig,
		private readonly logger: Logger,
	) {}

	// create new user or find existing by telegram data
	async findOrCreateUser(telegramData: TelegramInitData): Promise<CreateUserResponse> {
		if (this.config.devMode) {
			return this.mockUser(telegramData)
		}

		// trying to find existing one
		try {
			return await this.findUserByIntegration('telegram', telegramData.telegramId.toString())
		} catch {
			// not found, creating new one
		}

		const request: CreateUserRequest = {
			integrations: [
				{
					type: 'telegram',
					external_id: telegramData.telegramId.toString(),
					external_data: {
						username: telegramData.username,
						first_name: telegramData.firstName,
						last_name: telegramData.lastName,
						photo_url: telegramData.photoUrl,
						language_code: telegramData.languageCode,
					},
					is_primary: true,
				},
			],
		}

		const response = await fetch(`${this.config.serviceUrl}/internal/users`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(request),
			signal: AbortSignal.timeout(this.config.serviceTimeout),
		})

		if (!response.ok) {
			throw new Error(`failed to create user: ${response.status}`)
		}

		return (await response.json()) as CreateUserResponse
	}

	// create jwt token for user
	async createToken(userId: string, clientInfo?: Record<string, unknown>): Promise<CreateTokenResponse> {
		if (this.config.devMode) {
			return this.mockToken(userId)
		}

		const request: CreateTokenRequest = {
			user_id: userId,
			requested_by: 'chopcheck',
			permissions: ['cc:splits:read', 'cc:splits:write', 'cc:splits:create'],
			client_info: clientInfo || {},
		}

		const response = await fetch(`${this.config.serviceUrl}/internal/tokens`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(request),
			signal: AbortSignal.timeout(this.config.serviceTimeout),
		})

		if (!response.ok) {
			throw new Error(`failed to create token: ${response.status}`)
		}

		return (await response.json()) as CreateTokenResponse
	}

	// validate jwt token
	async validateToken(token: string): Promise<AuthContext> {
		try {
			const claims = await this.verifyJwt(token)

			// checks
			if (!claims.sub || !claims.jti) {
				throw new Error('missing required claims')
			}

			if (!claims.aud.includes(this.config.jwtAudience[0]!)) {
				throw new Error('invalid audience')
			}

			return {
				userId: claims.sub,
				tokenId: claims.jti,
				permissions: new Set(claims.permissions),
				requestedBy: claims.requested_by,
			}
		} catch (error) {
			this.logger.warn('jwt validation failed', { error })
			throw new Error('invalid token')
		}
	}

	// extract token from authorization header
	extractTokenFromHeader(authHeader?: string): string {
		if (!authHeader) {
			throw new Error('authorization header missing')
		}

		const [scheme, token] = authHeader.split(' ')
		if (scheme !== 'Bearer' || !token) {
			throw new Error('invalid authorization header format')
		}

		return token
	}

	private async findUserByIntegration(type: string, externalId: string): Promise<CreateUserResponse> {
		const response = await fetch(`${this.config.serviceUrl}/internal/users/by-integration/${type}/${externalId}`, {
			signal: AbortSignal.timeout(this.config.serviceTimeout),
		})

		if (!response.ok) {
			throw new Error(`user not found: ${response.status}`)
		}

		return (await response.json()) as CreateUserResponse
	}

	private mockUser(telegramData: TelegramInitData): CreateUserResponse {
		const displayName = [telegramData.firstName, telegramData.lastName].filter(Boolean).join(' ') || 'Dev User'

		return {
			user_id: randomUUID(),
			display_name: displayName,
			username: telegramData.username,
			avatar_url: telegramData.photoUrl,
			status: 'active',
			metadata: { dev_mode: true },
		}
	}

	private async mockToken(userId: string): Promise<CreateTokenResponse> {
		const now = Math.floor(Date.now() / 1000)
		const jti = randomUUID()

		const claims: JwtClaims = {
			iss: this.config.jwtIssuer,
			aud: [this.config.jwtAudience],
			sub: userId,
			jti,
			exp: now + 86400, // 24h
			iat: now,
			requested_by: 'chopcheck',
			permissions: ['cc:splits:read', 'cc:splits:write', 'cc:splits:create'],
		}

		const token = await this.signJwt(claims)

		return {
			access_token: token,
			expires_at: new Date((now + 86400) * 1000).toISOString(),
			jti,
		}
	}

	private async verifyJwt(token: string): Promise<JwtClaims> {
		const parts = token.split('.')
		if (parts.length !== 3) {
			throw new Error('invalid token format')
		}

		const [encodedHeader, encodedClaims, encodedSignature] = parts
		const message = `${encodedHeader}.${encodedClaims}`

		// verify signature
		const encoder = new TextEncoder()
		const key = await crypto.subtle.importKey(
			'raw',
			encoder.encode(this.config.jwtSecret),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['verify'],
		)

		const signature = this.base64UrlDecode(encodedSignature!)
		const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(message))

		if (!isValid) {
			throw new Error('invalid signature')
		}

		// decode claims
		const claims = JSON.parse(this.base64UrlDecodeText(encodedClaims!)) as JwtClaims

		// check expiration
		const now = Math.floor(Date.now() / 1000)
		if (claims.exp < now) {
			throw new Error('token expired')
		}

		return claims
	}

	private async signJwt(claims: JwtClaims): Promise<string> {
		const encoder = new TextEncoder()
		const header = { alg: 'HS256', typ: 'JWT' }

		const encodedHeader = this.base64UrlEncode(JSON.stringify(header))
		const encodedClaims = this.base64UrlEncode(JSON.stringify(claims))

		const message = `${encodedHeader}.${encodedClaims}`
		const key = await crypto.subtle.importKey(
			'raw',
			encoder.encode(this.config.jwtSecret),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['sign'],
		)

		const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
		const encodedSignature = this.base64UrlEncode(signature)

		return `${message}.${encodedSignature}`
	}

	private base64UrlEncode(data: string | ArrayBuffer): string {
		let base64: string
		if (typeof data === 'string') {
			base64 = btoa(data)
		} else {
			base64 = btoa(String.fromCharCode(...new Uint8Array(data)))
		}

		return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
	}

	private base64UrlDecode(data: string): ArrayBuffer {
		const base64 = data
			.replace(/-/g, '+')
			.replace(/_/g, '/')
			.padEnd(data.length + ((4 - (data.length % 4)) % 4), '=')
		const binary = atob(base64)
		const bytes = new Uint8Array(binary.length)
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i)
		}
		return bytes.buffer
	}

	private base64UrlDecodeText(data: string): string {
		const base64 = data
			.replace(/-/g, '+')
			.replace(/_/g, '/')
			.padEnd(data.length + ((4 - (data.length % 4)) % 4), '=')
		return atob(base64)
	}
}
