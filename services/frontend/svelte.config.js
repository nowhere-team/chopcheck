import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import adapter from 'svelte-adapter-bun'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			out: './build',
			precompress: true,
			envPrefix: ''
		}),
		alias: {
			$api: 'src/lib/api',
			$stores: 'src/lib/stores',
			$telegram: 'src/lib/telegram',
			$server: 'src/server',
			$theme: 'src/lib/theme',
			$components: 'src/lib/components',
			$utils: 'src/lib/utils'
		}
	}
}

export default config
