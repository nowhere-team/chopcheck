import { createLogger } from '$lib/shared/logger'
import { toast } from '$lib/ui/features/toasts/toast.svelte'

const log = createLogger('connection')

class ConnectionMonitor {
	private _online = $state(typeof navigator !== 'undefined' ? navigator.onLine : true)
	private toastId: string | null = null
	private initialized = false

	get online() {
		return this._online
	}

	init(): void {
		if (this.initialized || typeof window === 'undefined') return

		window.addEventListener('online', this.handleOnline)
		window.addEventListener('offline', this.handleOffline)

		this.initialized = true
		log.info('connection monitor initialized', { online: this._online })
	}

	destroy(): void {
		if (typeof window === 'undefined') return

		window.removeEventListener('online', this.handleOnline)
		window.removeEventListener('offline', this.handleOffline)
		this.initialized = false
	}

	private handleOnline = (): void => {
		log.info('connection restored')
		this._online = true

		if (this.toastId) {
			toast.dismiss(this.toastId)
			this.toastId = null
		}

		toast.success('Соединение восстановлено')
	}

	private handleOffline = (): void => {
		log.warn('connection lost')
		this._online = false

		this.toastId = toast.error('Нет соединения с интернетом', {
			duration: 0,
			dismissible: false
		})
	}
}

export const connectionMonitor = new ConnectionMonitor()
