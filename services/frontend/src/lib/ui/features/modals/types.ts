export type ModalType = 'alert' | 'confirm' | 'prompt' | 'custom'

export interface ModalButton {
	label: string
	variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
	value?: unknown
	icon?: string // emoji or component name
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
	layout?: 'default' | 'stacked' | 'horizontal'
}

export interface ModalState extends ModalConfig {
	id: string
	resolve: (value: unknown) => void
}
