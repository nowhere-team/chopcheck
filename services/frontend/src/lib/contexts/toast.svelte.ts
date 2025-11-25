import { getContext, setContext } from 'svelte'

const TOAST_KEY = Symbol('toast')

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
	id: string
	message: string
	type: ToastType
}

interface ToastContext {
	toasts: Toast[]
	show: (message: string, type: ToastType) => void
	remove: (id: string) => void
	success: (message: string) => void
	error: (message: string) => void
	info: (message: string) => void
}

export function setToastContext() {
	let toasts = $state<Toast[]>([])

	function show(message: string, type: ToastType = 'info') {
		const id = Math.random().toString(36).slice(2, 11)
		const toast: Toast = { id, message, type }

		toasts = [...toasts, toast]

		setTimeout(() => {
			remove(id)
		}, 3000)
	}

	function remove(id: string) {
		toasts = toasts.filter(t => t.id !== id)
	}

	function success(message: string) {
		show(message, 'success')
	}

	function error(message: string) {
		show(message, 'error')
	}

	function info(message: string) {
		show(message, 'info')
	}

	const context: ToastContext = {
		get toasts() {
			return toasts
		},
		show,
		remove,
		success,
		error,
		info
	}

	setContext(TOAST_KEY, context)
	return context
}

export function getToastContext() {
	const context = getContext<ToastContext>(TOAST_KEY)
	if (!context) {
		throw new Error('toast context not found')
	}
	return context
}
