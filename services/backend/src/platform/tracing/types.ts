import type { Context, Span } from '@opentelemetry/api'

export interface TracingConfig {
	enabled: boolean
	serviceName: string
	exporterUrl?: string
	exporterType?: 'otlp' | 'console' | 'none'
}

export interface SpanContext {
	span: Span
	context: Context
	traceId: string
	spanId: string
	end(status?: 'ok' | 'error'): void
	addEvent(name: string, attributes?: Record<string, unknown>): void
	setAttribute(key: string, value: unknown): void
	child(name: string, attributes?: Record<string, unknown>): SpanContext
}

export interface Tracer {
	readonly enabled: boolean
	startSpan(name: string, attributes?: Record<string, unknown>): SpanContext
	startSpanFromContext(name: string, parentContext: Context, attributes?: Record<string, unknown>): SpanContext
	extract(headers: Record<string, string>): Context | undefined
	inject(headers: Record<string, string>): void
	injectFromContext(ctx: Context, headers: Record<string, string>): void
	shutdown(): Promise<void>
}
