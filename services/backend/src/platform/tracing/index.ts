import { NoopTracer } from './noop'
import { OtelTracer } from './otel'
import type { Tracer, TracingConfig } from './types'

export function createTracer(config: TracingConfig): Tracer {
	if (!config.enabled || config.exporterType === 'none') {
		return new NoopTracer()
	}

	return new OtelTracer(config)
}

export type { SpanContext, Tracer, TracingConfig } from './types'
