import { createLogger } from '$lib/shared/logger'

import { cache, type CacheOptions } from './cache.svelte'

const log = createLogger('query')

export type QueryStatus = 'idle' | 'loading' | 'success' | 'error'

export interface QueryState<T> {
	data: T | null
	status: QueryStatus
	error: Error | null
	isLoading: boolean
	isError: boolean
	isSuccess: boolean
	lastFetchedAt: number | null
}

export interface QueryOptions<T> extends CacheOptions {
	enabled?: boolean
	initialData?: T
	onSuccess?: (data: T) => void
	onError?: (error: Error) => void
	refetchOnMount?: boolean
}

export function createQuery<T>(
	key: string | (() => string),
	fetcher: () => Promise<T>,
	options: QueryOptions<T> = {}
) {
	const {
		enabled = true,
		initialData,
		onSuccess,
		onError,
		refetchOnMount = true,
		ttl
		// staleWhileRevalidate = true
	} = options

	let data = $state<T | null>(initialData ?? null)
	let status = $state<QueryStatus>('idle')
	let error = $state<Error | null>(null)
	let lastFetchedAt = $state<number | null>(null)

	const resolveKey = () => (typeof key === 'function' ? key() : key)

	async function fetch(force = false): Promise<T | null> {
		const cacheKey = resolveKey()

		if (!force) {
			const cached = cache.get<T>(cacheKey)
			if (cached !== null) {
				data = cached
				status = 'success'
				return cached
			}
		}

		status = 'loading'
		error = null

		try {
			const result = await cache.dedupe(cacheKey, fetcher)
			cache.set(cacheKey, result, { ttl })

			data = result
			status = 'success'
			lastFetchedAt = Date.now()

			onSuccess?.(result)
			log.debug(`query success: ${cacheKey}`)

			return result
		} catch (e) {
			const err = e instanceof Error ? e : new Error(String(e))
			error = err
			status = 'error'

			onError?.(err)
			log.error(`query error: ${cacheKey}`, err)

			return null
		}
	}

	function invalidate(): void {
		cache.invalidate(resolveKey())
	}

	function reset(): void {
		data = initialData ?? null
		status = 'idle'
		error = null
		lastFetchedAt = null
	}

	// auto-fetch on mount if enabled
	$effect(() => {
		if (enabled && refetchOnMount) {
			fetch()
		}
	})

	return {
		get data() {
			return data
		},
		get status() {
			return status
		},
		get error() {
			return error
		},
		get isLoading() {
			return status === 'loading'
		},
		get isError() {
			return status === 'error'
		},
		get isSuccess() {
			return status === 'success'
		},
		get lastFetchedAt() {
			return lastFetchedAt
		},
		fetch,
		refetch: () => fetch(true),
		invalidate,
		reset
	}
}

// mutation helper for write operations
export interface MutationOptions<TData, TVariables> {
	onSuccess?: (data: TData, variables: TVariables) => void
	onError?: (error: Error, variables: TVariables) => void
	onSettled?: (data: TData | null, error: Error | null, variables: TVariables) => void
	invalidateKeys?: string[]
}

export function createMutation<TData, TVariables = void>(
	mutationFn: (variables: TVariables) => Promise<TData>,
	options: MutationOptions<TData, TVariables> = {}
) {
	let data = $state<TData | null>(null)
	let status = $state<QueryStatus>('idle')
	let error = $state<Error | null>(null)

	async function mutate(variables: TVariables): Promise<TData | null> {
		status = 'loading'
		error = null

		try {
			const result = await mutationFn(variables)
			data = result
			status = 'success'

			options.onSuccess?.(result, variables)

			// invalidate related queries
			if (options.invalidateKeys) {
				options.invalidateKeys.forEach(key => {
					if (key.includes('*')) {
						cache.invalidatePattern(key)
					} else {
						cache.invalidate(key)
					}
				})
			}

			options.onSettled?.(result, null, variables)
			return result
		} catch (e) {
			const err = e instanceof Error ? e : new Error(String(e))
			error = err
			status = 'error'

			options.onError?.(err, variables)
			options.onSettled?.(null, err, variables)

			return null
		}
	}

	function reset(): void {
		data = null
		status = 'idle'
		error = null
	}

	return {
		get data() {
			return data
		},
		get status() {
			return status
		},
		get error() {
			return error
		},
		get isLoading() {
			return status === 'loading'
		},
		get isError() {
			return status === 'error'
		},
		get isSuccess() {
			return status === 'success'
		},
		mutate,
		reset
	}
}
