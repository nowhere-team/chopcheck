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

	const currencySymbols: Record<string, string> = {
		RUB: '₽',
		USD: '$',
		EUR: '€'
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement
		let inputValue = target.value

		inputValue = inputValue.replace(/[^\d,]/g, '')

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

	function handleBlur() {
		displayValue = formatPriceInput(value)
	}

	$effect(() => {
		if (document.activeElement?.id !== `price-input-${Math.random()}`) {
			displayValue = formatPriceInput(value)
		}
	})
</script>

<Input
	{label}
	value={displayValue}
	oninput={handleInput}
	onblur={handleBlur}
	suffix={currencySymbols[draft.split.currency] || draft.split.currency}
	{error}
	inputmode="decimal"
	placeholder="0,00"
/>
