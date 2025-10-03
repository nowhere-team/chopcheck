export type IntegrationType = 'telegram'

export interface AuthConfig {
	serviceUrl?: string // auth service url for production
	serviceTimeout: number
	devMode: boolean
	jwtSecret: string // for token validation
	jwtIssuer: string
	jwtAudience: string
}

export interface AuthContext {
	userId: string
	tokenId: string
	permissions: Set<string>
	requestedBy: string
}

export interface JwtClaims {
	iss: string // issuer
	aud: string[] // audience
	sub: string // subject (user_id)
	jti: string // jwt token id
	exp: number // expires at
	iat: number // issued at
	requested_by: string // custom: who requested the token
	permissions: string[] // custom: user permissions
}

// auth service api contracts
export interface CreateUserRequest {
	custom_username?: string
	custom_display_name?: string
	custom_avatar_url?: string
	integrations: Array<{
		type: IntegrationType
		external_id: string
		external_data: {
			username?: string
			first_name?: string
			last_name?: string
			photo_url?: string
			language_code?: string
		}
		is_primary: boolean
	}>
}

export interface CreateUserResponse {
	user_id: string
	display_name: string
	username?: string
	avatar_url?: string
	metadata: Record<string, unknown>
}

export interface CreateTokenRequest {
	user_id: string
	requested_by: string
	permissions: string[]
	client_info: {
		user_agent?: string
		ip?: string
		platform?: string
	}
	ttl_seconds?: number
}

export interface CreateTokenResponse {
	access_token: string
	expires_at: string
	jti: string
}
