import type { Logger } from '@/platform/logger'

import type { TokenState } from './types'

export class TokenManager {
	private readonly tokens: TokenState[] = []
	private currentIndex = 0
	private readonly rotationMs: number

	constructor(
		tokenValues: string[],
		rotationMinutes: number,
		private readonly logger: Logger,
	) {
		if (tokenValues.length === 0) {
			throw new Error('at least one fns token is required')
		}

		this.tokens = tokenValues.map(value => ({
			value,
			successCount: 0,
			errorCount: 0,
			lastUsed: 0,
			disabled: false,
		}))

		this.rotationMs = rotationMinutes * 60 * 1000
		this.startRotation()
	}

	private startRotation(): void {
		setInterval(() => {
			this.rotate()
		}, this.rotationMs)
	}

	private rotate(): void {
		const enabledCount = this.tokens.filter(t => !t.disabled).length
		if (enabledCount === 0) {
			this.logger.warn('all fns tokens are disabled, re-enabling all')
			for (const token of this.tokens) {
				token.disabled = false
				token.disabledUntil = undefined
			}
		}

		// move to next enabled token
		const startIndex = this.currentIndex
		do {
			this.currentIndex = (this.currentIndex + 1) % this.tokens.length
		} while (this.tokens[this.currentIndex]!.disabled && this.currentIndex !== startIndex)

		this.logger.debug('token rotated', {
			index: this.currentIndex,
			total: this.tokens.length,
		})
	}

	getCurrentToken(): string {
		// check if disabled tokens can be re-enabled
		const now = Date.now()
		for (const token of this.tokens) {
			if (token.disabled && token.disabledUntil && token.disabledUntil < now) {
				token.disabled = false
				token.disabledUntil = undefined
				this.logger.info('token re-enabled after cooldown', { token: this.maskToken(token.value) })
			}
		}

		// find first enabled token starting from current
		for (let i = 0; i < this.tokens.length; i++) {
			const idx = (this.currentIndex + i) % this.tokens.length
			if (!this.tokens[idx]!.disabled) {
				this.currentIndex = idx
				return this.tokens[idx]!.value
			}
		}

		// all disabled - use first one anyway
		this.logger.error('all fns tokens disabled, using first token')
		return this.tokens[0]!.value
	}

	recordSuccess(token: string): void {
		const state = this.tokens.find(t => t.value === token)
		if (state) {
			state.successCount++
			state.lastUsed = Date.now()
			state.errorCount = 0 // reset error count on success
		}
	}

	recordError(token: string, error: string): void {
		const state = this.tokens.find(t => t.value === token)
		if (state) {
			state.errorCount++
			state.lastError = error
			state.lastUsed = Date.now()

			// disable token after 3 consecutive errors
			if (state.errorCount >= 3) {
				state.disabled = true
				state.disabledUntil = Date.now() + 5 * 60 * 1000 // 5 minutes cooldown
				this.logger.warn('token disabled due to errors', {
					token: this.maskToken(token),
					errorCount: state.errorCount,
				})
				this.rotate()
			}
		}
	}

	getStats(): Array<{
		token: string
		success: number
		errors: number
		disabled: boolean
		lastUsed: string
	}> {
		return this.tokens.map(t => ({
			token: this.maskToken(t.value),
			success: t.successCount,
			errors: t.errorCount,
			disabled: t.disabled,
			lastUsed: t.lastUsed ? new Date(t.lastUsed).toISOString() : 'never',
		}))
	}

	private maskToken(token: string): string {
		if (token.length <= 8) return '***'
		return token.slice(0, 4) + '...' + token.slice(-4)
	}
}
