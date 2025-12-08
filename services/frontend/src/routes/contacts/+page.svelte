<script>
	import { onMount } from 'svelte'

	import { toast } from '$lib/ui/features/toasts'

	let counter = $state(0)

	onMount(() => {
		toast.info(`Toast #${counter++}`, { dismissible: true, duration: 200000 })
		toast.warning(`Toast #${counter++}`, { dismissible: true, duration: 2000 })
		toast.error(`Toast #${counter++}`, { dismissible: true, duration: 2000 })
		toast.success(`Toast #${counter++}`, { dismissible: true, duration: 2000 })
		// setInterval(() => {
		//
		// 	toast.warning(`Toast #${counter++}`, { dismissible: true, duration: 2000 })
		// 	toast.error(`Toast #${counter++}`, { dismissible: true, duration: 2000 })
		// 	toast.success(`Toast #${counter++}`, { dismissible: true, duration: 2000 })
		// }, 4000)
	})
</script>

<div class="test"></div>

<style>
	.test {
		padding: 16px;
	}
</style>
