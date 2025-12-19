export type ModalType = 'alert' | 'confirm' | 'prompt' | 'custom'

export interface ModalButton {
	label: string
	variant?: 'primary' | 'secondary' | 'danger'
	value?: unknown
}

export interface ModalConfig {
	type: ModalType
	title?: string
	message?: string
	icon?: string
	buttons?: ModalButton[]
	inputPlaceholder?: string
	inputValue?: string
	dismissible?: boolean
}

export interface ModalState extends ModalConfig {
	id: string
	resolve: (value: unknown) => void
}
