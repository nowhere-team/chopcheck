import type { ModalConfig, ModalState } from './types'

class ModalManager {
	stack = $state<ModalState[]>([])

	get current(): ModalState | null {
		return this.stack[this.stack.length - 1] ?? null
	}

	private show(config: ModalConfig): Promise<unknown> {
		return new Promise(resolve => {
			const id = crypto.randomUUID()
			this.stack = [...this.stack, { ...config, id, resolve }]
		})
	}

	close(value?: unknown): void {
		const current = this.current
		if (current) {
			current.resolve(value)
			this.stack = this.stack.slice(0, -1)
		}
	}

	alert(message: string, options?: { title?: string; icon?: string }): Promise<void> {
		return this.show({
			type: 'alert',
			message,
			title: options?.title,
			icon: options?.icon,
			buttons: [{ label: 'ОК', variant: 'primary', value: true }],
			dismissible: true
		}) as Promise<void>
	}

	confirm(
		message: string,
		options?: {
			title?: string
			icon?: string
			confirmLabel?: string
			cancelLabel?: string
			danger?: boolean
		}
	): Promise<boolean> {
		return this.show({
			type: 'confirm',
			message,
			title: options?.title,
			icon: options?.icon,
			buttons: [
				{ label: options?.cancelLabel ?? 'Отмена', variant: 'secondary', value: false },
				{
					label: options?.confirmLabel ?? 'Подтвердить',
					variant: options?.danger ? 'danger' : 'primary',
					value: true
				}
			],
			dismissible: true
		}) as Promise<boolean>
	}

	prompt(
		message: string,
		options?: {
			title?: string
			placeholder?: string
			defaultValue?: string
			confirmLabel?: string
		}
	): Promise<string | null> {
		return this.show({
			type: 'prompt',
			message,
			title: options?.title,
			inputPlaceholder: options?.placeholder,
			inputValue: options?.defaultValue ?? '',
			buttons: [
				{ label: 'Отмена', variant: 'secondary', value: null },
				{ label: options?.confirmLabel ?? 'ОК', variant: 'primary', value: '__input__' }
			],
			dismissible: true
		}) as Promise<string | null>
	}
}

export const modal = new ModalManager()
