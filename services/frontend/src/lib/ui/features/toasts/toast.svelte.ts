export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
	id: string
	message: string
	type: ToastType
	duration: number
	dismissible: boolean
}

interface ToastOptions {
	duration?: number
	dismissible?: boolean
}

class ToastController {
	private _toasts = $state<Toast[]>([])
	private queue: Toast[] = []
	private readonly maxVisible = 3

	get toasts() {
		return this._toasts
	}

	private enqueue(toast: Toast) {
		// если места нет — добавляем в очередь
		if (this._toasts.length >= this.maxVisible) {
			this.queue.push(toast)
			return
		}
		this._toasts = [...this._toasts, toast]
		if (toast.duration > 0) {
			setTimeout(() => this.dismiss(toast.id), toast.duration)
		}
	}

	private tryFlushQueue() {
		while (this._toasts.length < this.maxVisible && this.queue.length > 0) {
			const next = this.queue.shift()!
			this._toasts = [...this._toasts, next]
			if (next.duration > 0) {
				setTimeout(() => this.dismiss(next.id), next.duration)
			}
		}
	}

	private add(message: string, type: ToastType, options: ToastOptions = {}): string {
		const id = crypto.randomUUID()
		const duration = options.duration ?? (type === 'error' ? 5000 : 3000)
		const dismissible = options.dismissible ?? true

		const t: Toast = { id, message, type, duration, dismissible }
		this.enqueue(t)

		return id
	}

	dismiss(id: string): void {
		this._toasts = this._toasts.filter(t => t.id !== id)
		this.tryFlushQueue()
	}

	dismissAll(): void {
		this._toasts = []
		this.queue = []
	}

	success(message: string, options?: ToastOptions): string {
		return this.add(message, 'success', options)
	}

	error(message: string, options?: ToastOptions): string {
		return this.add(message, 'error', options)
	}

	info(message: string, options?: ToastOptions): string {
		return this.add(message, 'info', options)
	}

	warning(message: string, options?: ToastOptions): string {
		return this.add(message, 'warning', options)
	}

	connectionLost(): string {
		return this.add('Соединение с сервером потеряно', 'error', {
			duration: 0,
			dismissible: false
		})
	}

	connectionRestored(): void {
		this._toasts = this._toasts.filter(t => t.message !== 'Соединение с сервером потеряно')
		this.success('Соединение восстановлено')
	}
}

export const toast = new ToastController()
