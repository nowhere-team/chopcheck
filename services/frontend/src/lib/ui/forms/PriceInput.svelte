<script lang="ts">
	import { formatPriceInput, parsePriceInput } from '$lib/shared/money'
	import { Input } from '$lib/ui/components'

	interface Props {
		label?: string
		value: number // in kopecks
		error?: string
		currencySymbol?: string
	}

	let { label, value = $bindable(0), error, currencySymbol = '₽' }: Props = $props()

	let displayValue = $state('')
	let isFocused = $state(false)

	// sync external value changes to display only when not focused
	$effect(() => {
		if (!isFocused) {
			displayValue = formatPriceInput(value)
		}
	})

	function handleInput(e: Event & { currentTarget: HTMLInputElement }) {
		const raw = e.currentTarget.value
		// clean input on the fly
		const cleaned = raw.replace(/[^0-9.,]/g, '').replace('.', ',')

		if (cleaned !== raw) {
			displayValue = cleaned
			// cursor position logic implies complexity, simplifying for now
		}

		value = parsePriceInput(cleaned)
	}

	function handleFocus() {
		isFocused = true
		if (value === 0) displayValue = ''
		// feedback
		/* haptic.selection() */
	}

	function handleBlur() {
		isFocused = false
		displayValue = formatPriceInput(value)
	}
</script>

<Input
	{label}
	bind:value={displayValue}
	oninput={handleInput}
	onfocus={handleFocus}
	onblur={handleBlur}
	suffix={currencySymbol}
	{error}
	inputmode="decimal"
	type="text"
	placeholder="0,00"
/>
