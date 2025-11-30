import ky, { type KyInstance } from 'ky'

import type { Logger } from '@/platform/logger'
import type { SpanContext, Tracer } from '@/platform/tracing'

import { TokenManager } from './token-manager'
import type { FnsClientConfig, FnsReceiptData, FnsResponse } from './types'

export class FnsClient {
	private readonly api: KyInstance
	private readonly tokenManager: TokenManager

	constructor(
		private readonly config: FnsClientConfig,
		private readonly logger: Logger,
		private readonly tracer: Tracer,
	) {
		this.tokenManager = new TokenManager(config.tokens, config.rotationMinutes, logger.named('token-manager'))

		this.api = ky.create({
			prefixUrl: config.apiUrl,
			timeout: config.requestTimeout,
			retry: 0, // we handle retries ourselves with token rotation
		})
	}

	async getReceiptByQr(qrRaw: string, parentSpan?: SpanContext): Promise<FnsReceiptData> {
		const span =
			parentSpan?.child('fns.getReceiptByQr', { qrRaw: qrRaw.slice(0, 50) }) ??
			this.tracer.startSpan('fns.getReceiptByQr')

		let lastError: Error | null = null
		const maxAttempts = Math.min(this.config.tokens.length, 3)

		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			const token = this.tokenManager.getCurrentToken()
			span.addEvent('attempt', { attempt, tokenMasked: token.slice(0, 4) + '...' })

			try {
				const response = await this.api
					.post('check/get', {
						json: {
							qrraw: qrRaw,
							token,
						},
					})
					.json<FnsResponse>()

				if (response.code === 1 && response.data?.json) {
					this.tokenManager.recordSuccess(token)
					span.setAttribute('success', true)
					span.end('ok')
					return response.data.json
				}

				// api returned error code
				const errorMsg = `fns api error code: ${response.code}`
				this.tokenManager.recordError(token, errorMsg)
				lastError = new Error(errorMsg)
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : 'unknown error'
				this.tokenManager.recordError(token, errorMsg)
				lastError = error instanceof Error ? error : new Error(errorMsg)

				this.logger.warn('fns request failed, trying next token', {
					attempt,
					error: errorMsg,
				})
			}
		}

		span.setAttribute('error', true)
		span.end('error')
		throw lastError ?? new Error('fns request failed after all attempts')
	}

	parseQrData(qrRaw: string): {
		t: string
		s: string
		fn: string
		i: string
		fp: string
		n: string
	} | null {
		// format: t=20200924T1837&s=349.93&fn=9282440300682838&i=46534&fp=1273019065&n=1
		const params = new URLSearchParams(qrRaw)
		const t = params.get('t')
		const s = params.get('s')
		const fn = params.get('fn')
		const i = params.get('i')
		const fp = params.get('fp')
		const n = params.get('n')

		if (!t || !s || !fn || !i || !fp || !n) {
			return null
		}

		return { t, s, fn, i, fp, n }
	}

	getTokenStats() {
		return this.tokenManager.getStats()
	}
}
