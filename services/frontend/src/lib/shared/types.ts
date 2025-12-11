export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>

export function ok<T>(value: T): Result<T, never> {
	return { ok: true, value }
}

export function err<E>(error: E): Result<never, E> {
	return { ok: false, error }
}

export async function tryCatch<T>(fn: () => Promise<T>): AsyncResult<T> {
	try {
		return ok(await fn())
	} catch (e) {
		return err(e instanceof Error ? e : new Error(String(e)))
	}
}
