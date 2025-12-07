export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
	id: string
	message: string
	type: ToastType
	duration: number
}

class ToastController {
	private _toasts = $state<Toast[]>([])

	get toasts() {
		return this._toasts
	}

	show(message: string, type: ToastType = 'info', duration = 3000) {
		const id = Math.random().toString(36).slice(2)
		const toast: Toast = { id, message, type, duration }

		this._toasts.push(toast)

		if (duration > 0) {
			setTimeout(() => {
				this.dismiss(id)
			}, duration)
		}
	}

	dismiss(id: string) {
		this._toasts = this._toasts.filter(t => t.id !== id)
	}

	success(message: string) {
		this.show(message, 'success')
	}

	error(message: string) {
		this.show(message, 'error', 4000)
	}
}

export const toast = new ToastController()
