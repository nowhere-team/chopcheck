import { getContext, setContext } from 'svelte'

import type { User } from '$api/types'

const AUTH_KEY = Symbol('AUTH_KEY')

interface AuthContext {
	user: User | null
	isLoading: boolean
	error: string | null
	readonly isAuthenticated: boolean
}

export function setAuthContext() {
	const auth = $state<AuthContext>({
		user: null,
		isLoading: true,
		error: null,
		get isAuthenticated() {
			return this.user !== null
		}
	})

	setContext(AUTH_KEY, auth)

	return auth
}
export function getAuthContext() {
	const auth = getContext<AuthContext>(AUTH_KEY)
	if (!auth) {
		throw new Error('auth context not found')
	}
	return auth
}
