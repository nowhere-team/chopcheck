<script lang="ts">
	import Input from '$components/Input.svelte'
	import { getDraftContext } from '$lib/contexts/draft.svelte'
	import { formatPriceInput, parsePrice } from '$lib/utils/price'

	interface Props {
		label?: string
		value?: number
		error?: string
	}

	let { label, value = $bindable(0), error }: Props = $props()

	const draft = getDraftContext()

	let displayValue = $state(formatPriceInput(value))
	let isFocused = $state(false)

	const currencySymbols: Record<string, string> = {
		RUB: '₽',
		USD: '$',
		EUR: '€'
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement
		let inputValue = target.value

		// Разрешаем цифры, запятую и точку
		inputValue = inputValue.replace(/[^\d.,]/g, '')

		// Заменяем точку на запятую для единообразия
		inputValue = inputValue.replace(/\./g, ',')

		const parts = inputValue.split(',')
		if (parts.length > 2) {
			inputValue = parts[0] + ',' + parts.slice(1).join('')
		}
		if (parts[1] && parts[1].length > 2) {
			inputValue = parts[0] + ',' + parts[1].slice(0, 2)
		}

		displayValue = inputValue
		value = parsePrice(inputValue)
	}

	function handleFocus() {
		isFocused = true
		// При фокусе показываем чистое значение без форматирования
		if (value === 0) {
			displayValue = ''
		}
	}

	function handleBlur() {
		isFocused = false
		displayValue = formatPriceInput(value)
	}

	// Обновляем displayValue только когда поле не в фокусе
	$effect(() => {
		if (!isFocused) {
			displayValue = formatPriceInput(value)
		}
	})
</script>

<Input
	{label}
	value={displayValue}
	oninput={handleInput}
	onfocus={handleFocus}
	onblur={handleBlur}
	suffix={currencySymbols[draft.split.currency] || draft.split.currency}
	{error}
	inputmode="decimal"
	pattern="[0-9.,]*"
	placeholder="0,00"
/>
