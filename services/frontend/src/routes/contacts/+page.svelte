<script>
	import { onMount } from 'svelte'

	import { toast } from '$lib/ui/features/toasts'

	let counter = 0

	onMount(() => {
		toast.info(`Toast #${counter++}`, { dismissible: true, duration: 200000 })
		// setInterval(() => {
		//
		// 	toast.warning(`Toast #${counter++}`, { dismissible: true, duration: 2000 })
		// 	toast.error(`Toast #${counter++}`, { dismissible: true, duration: 2000 })
		// 	toast.success(`Toast #${counter++}`, { dismissible: true, duration: 2000 })
		// }, 4000)
	})
</script>
