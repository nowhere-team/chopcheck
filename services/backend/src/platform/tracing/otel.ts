import { type Context, context, propagation, type Span, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api'
import { W3CTraceContextPropagator } from '@opentelemetry/core'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'

import type { SpanContext, Tracer, TracingConfig } from './types'

export class OtelTracer implements Tracer {
	readonly enabled = true
	private readonly sdk: NodeSDK
	private readonly tracer: ReturnType<typeof trace.getTracer>
	private readonly baseAttributes: Record<string, unknown>

	constructor(config: TracingConfig) {
		this.baseAttributes = {
			'service.name': config.serviceName,
		}

		const resource = resourceFromAttributes({
			[ATTR_SERVICE_NAME]: config.serviceName,
			[ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? '0.0.0',
		})

		const spanProcessors: any[] = []

		if (config.exporterType === 'console') {
			spanProcessors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()))
		} else if (config.exporterType === 'otlp' && config.exporterUrl) {
			spanProcessors.push(
				new BatchSpanProcessor(
					new OTLPTraceExporter({
						url: config.exporterUrl,
					}),
				),
			)
		}

		this.sdk = new NodeSDK({
			resource,
			spanProcessors,
		})

		this.sdk.start()

		propagation.setGlobalPropagator(new W3CTraceContextPropagator())

		this.tracer = trace.getTracer(config.serviceName)
	}

	startSpan(name: string, attributes: Record<string, unknown> = {}): SpanContext {
		const span = this.tracer.startSpan(name, {
			kind: SpanKind.INTERNAL,
			attributes: this.sanitizeAttributes({ ...this.baseAttributes, ...attributes }),
		})

		return this.createContext(span, trace.setSpan(context.active(), span))
	}

	startSpanFromContext(name: string, parentContext: Context, attributes: Record<string, unknown> = {}): SpanContext {
		const span = this.tracer.startSpan(
			name,
			{
				kind: SpanKind.INTERNAL,
				attributes: this.sanitizeAttributes({ ...this.baseAttributes, ...attributes }),
			},
			parentContext,
		)

		return this.createContext(span, trace.setSpan(parentContext, span))
	}

	extract(headers: Record<string, string>): Context | undefined {
		const extracted = propagation.extract(context.active(), headers, {
			get: (carrier, key) => carrier[key],
			keys: carrier => Object.keys(carrier),
		})

		const spanContext = trace.getSpanContext(extracted)
		if (spanContext && spanContext.traceId) {
			return extracted
		}

		return undefined
	}

	inject(headers: Record<string, string>): void {
		propagation.inject(context.active(), headers, {
			set: (carrier, key, value) => {
				carrier[key] = value
			},
		})
	}

	injectFromContext(ctx: Context, headers: Record<string, string>): void {
		propagation.inject(ctx, headers, {
			set: (carrier, key, value) => {
				carrier[key] = value
			},
		})
	}

	async shutdown(): Promise<void> {
		await this.sdk.shutdown()
	}

	private createContext(span: Span, ctx: Context): SpanContext {
		const spanCtx = span.spanContext()
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this

		return {
			span,
			context: ctx,
			traceId: spanCtx.traceId,
			spanId: spanCtx.spanId,

			end(status: 'ok' | 'error' = 'ok') {
				span.setStatus({
					code: status === 'ok' ? SpanStatusCode.OK : SpanStatusCode.ERROR,
				})
				span.end()
			},

			addEvent(name: string, attributes?: Record<string, unknown>) {
				span.addEvent(name, self.sanitizeAttributes(attributes ?? {}))
			},

			setAttribute(key: string, value: unknown) {
				const sanitized = self.sanitizeValue(value)
				if (sanitized !== undefined) {
					span.setAttribute(key, sanitized)
				}
			},

			child(name: string, attributes: Record<string, unknown> = {}): SpanContext {
				return self.startSpanFromContext(name, ctx, attributes)
			},
		}
	}

	private sanitizeAttributes(attrs: Record<string, unknown>): Record<string, string | number | boolean> {
		const result: Record<string, string | number | boolean> = {}

		for (const [key, value] of Object.entries(attrs)) {
			const sanitized = this.sanitizeValue(value)
			if (sanitized !== undefined) {
				result[key] = sanitized
			}
		}

		return result
	}

	private sanitizeValue(value: unknown): string | number | boolean | undefined {
		if (value === null || value === undefined) {
			return undefined
		}

		if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
			return value
		}

		if (typeof value === 'object') {
			return JSON.stringify(value)
		}

		return String(value)
	}
}
