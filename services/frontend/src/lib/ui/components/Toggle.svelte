<script lang="ts">
	import { getPlatform } from '$lib/app/context.svelte'

	interface Props {
		checked: boolean
		disabled?: boolean
		onchange?: (val: boolean) => void
	}

	let { checked = $bindable(), disabled = false, onchange }: Props = $props()
	const platform = getPlatform()

	function toggle() {
		if (disabled) return
		checked = !checked
		if (onchange) onchange(checked)
		platform.haptic.impact(checked ? 'medium' : 'light')
	}
</script>

<button
	class="toggle"
	class:checked
	class:disabled
	onclick={toggle}
	role="switch"
	aria-label="toggler"
	aria-checked={checked}
>
	<span class="thumb"></span>
</button>

<style>
	.toggle {
		all: unset;
		width: 50px;
		height: 30px;
		border-radius: 15px; /* pill shape */
		background: var(--color-bg-secondary); /* inactive color */
		position: relative;
		transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
		box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.05);
	}

	.toggle.checked {
		background: var(--color-primary); /* ios green or tg blue */
	}

	.thumb {
		width: 26px;
		height: 26px;
		background: #ffffff;
		border-radius: 50%;
		position: absolute;
		top: 2px;
		left: 2px;
		transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.toggle.checked .thumb {
		transform: translateX(20px);
	}

	.toggle.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
