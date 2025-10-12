<script lang="ts">
	import { onMount } from 'svelte'

	import favicon from '$lib/assets/favicon.svg'
	import { init } from '$telegram'

	const { children } = $props()
	let platform = $state('')

	onMount(async () => {
		const data = await init()
		platform = data.platform
	})
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-container">
	{@render children?.()}
</div>

<span>{platform}</span>

<style>
	:global(body) {
		background: white;
	}
</style>
