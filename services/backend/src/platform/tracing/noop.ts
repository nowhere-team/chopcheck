import type { Context, Span } from '@opentelemetry/api'
import { ROOT_CONTEXT } from '@opentelemetry/api'

import type { SpanContext, Tracer } from './types'

const noopSpan = {
	spanContext: () => ({ traceId: '00000000000000000000000000000000', spanId: '0000000000000000', traceFlags: 0 }),
	setAttribute: () => noopSpan,
	setAttributes: () => noopSpan,
	addEvent: () => noopSpan,
	setStatus: () => noopSpan,
	end: () => {},
	isRecording: () => false,
	recordException: () => {},
	updateName: () => noopSpan,
	addLink: () => noopSpan,
} as unknown as Span

const createNoopContext = (): SpanContext => ({
	span: noopSpan,
	context: ROOT_CONTEXT,
	traceId: '00000000000000000000000000000000',
	spanId: '0000000000000000',
	end: () => {},
	addEvent: () => {},
	setAttribute: () => {},
	child: () => createNoopContext(),
})

export class NoopTracer implements Tracer {
	readonly enabled = false

	startSpan(): SpanContext {
		return createNoopContext()
	}

	startSpanFromContext(): SpanContext {
		return createNoopContext()
	}

	extract(): Context | undefined {
		return undefined
	}

	inject(): void {}

	injectFromContext(): void {}

	async shutdown(): Promise<void> {}
}
