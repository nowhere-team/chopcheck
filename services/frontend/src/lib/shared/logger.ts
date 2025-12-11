export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
	level: LogLevel
	scope: string
	message: string
	timestamp: Date
	data?: unknown
}

export interface LogHandler {
	handle(entry: LogEntry): void
}

class ConsoleHandler implements LogHandler {
	handle(entry: LogEntry): void {
		const prefix = `[${entry.scope}]`
		const args =
			entry.data !== undefined ? [prefix, entry.message, entry.data] : [prefix, entry.message]

		switch (entry.level) {
			case 'debug':
				// eslint-disable-next-line no-console
				console.debug(...args)
				break
			case 'info':
				// eslint-disable-next-line no-console
				console.info(...args)
				break
			case 'warn':
				console.warn(...args)
				break
			case 'error':
				console.error(...args)
				break
		}
	}
}

class BufferHandler implements LogHandler {
	private buffer: LogEntry[] = []
	private readonly maxSize: number

	constructor(maxSize = 100) {
		this.maxSize = maxSize
	}

	handle(entry: LogEntry): void {
		this.buffer.push(entry)
		if (this.buffer.length > this.maxSize) {
			this.buffer.shift()
		}
	}

	getEntries(): LogEntry[] {
		return [...this.buffer]
	}

	clear(): void {
		this.buffer = []
	}
}

class LoggerService {
	private handlers: LogHandler[] = []
	private minLevel: LogLevel = 'debug'
	private readonly levelPriority: Record<LogLevel, number> = {
		debug: 0,
		info: 1,
		warn: 2,
		error: 3
	}

	private readonly bufferHandler: BufferHandler

	constructor() {
		this.bufferHandler = new BufferHandler(100)
		this.handlers.push(this.bufferHandler)

		// add console handler in development
		if (import.meta.env.DEV) {
			this.handlers.push(new ConsoleHandler())
		}
	}

	setMinLevel(level: LogLevel): void {
		this.minLevel = level
	}

	addHandler(handler: LogHandler): void {
		this.handlers.push(handler)
	}

	getBuffer(): LogEntry[] {
		return this.bufferHandler.getEntries()
	}

	clearBuffer(): void {
		this.bufferHandler.clear()
	}

	private log(level: LogLevel, scope: string, message: string, data?: unknown): void {
		if (this.levelPriority[level] < this.levelPriority[this.minLevel]) {
			return
		}

		const entry: LogEntry = {
			level,
			scope,
			message,
			timestamp: new Date(),
			data
		}

		for (const handler of this.handlers) {
			handler.handle(entry)
		}
	}

	createScoped(scope: string): ScopedLogger {
		return new ScopedLogger(this, scope)
	}

	debug(scope: string, message: string, data?: unknown): void {
		this.log('debug', scope, message, data)
	}

	info(scope: string, message: string, data?: unknown): void {
		this.log('info', scope, message, data)
	}

	warn(scope: string, message: string, data?: unknown): void {
		this.log('warn', scope, message, data)
	}

	error(scope: string, message: string, data?: unknown): void {
		this.log('error', scope, message, data)
	}
}

export class ScopedLogger {
	constructor(
		private service: LoggerService,
		private scope: string
	) {}

	debug(message: string, data?: unknown): void {
		this.service.debug(this.scope, message, data)
	}

	info(message: string, data?: unknown): void {
		this.service.info(this.scope, message, data)
	}

	warn(message: string, data?: unknown): void {
		this.service.warn(this.scope, message, data)
	}

	error(message: string, data?: unknown): void {
		this.service.error(this.scope, message, data)
	}
}

// singleton instance
export const logger = new LoggerService()

// factory for scoped loggers
export function createLogger(scope: string): ScopedLogger {
	return logger.createScoped(scope)
}
