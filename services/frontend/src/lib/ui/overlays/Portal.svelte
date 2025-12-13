<script lang="ts">
	import type { Snippet } from 'svelte'
	import { getAllContexts, mount, unmount } from 'svelte'

	import PortalConsumer from './PortalConsumer.svelte'

	interface Props {
		children: Snippet
		target?: string | HTMLElement
	}

	const { children, target = 'body' }: Props = $props()

	const context = getAllContexts()

	$effect(() => {
		const targetEl =
			typeof target === 'string' ? (document.querySelector(target) ?? document.body) : target

		const wrapper = document.createElement('div')
		wrapper.className = 'portal-instance'
		targetEl.appendChild(wrapper)

		const instance = mount(PortalConsumer, {
			target: wrapper,
			props: { children },
			context
		})

		return () => {
			unmount(instance)
			wrapper.remove()
		}
	})
</script>
