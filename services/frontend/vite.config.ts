import { paraglideVitePlugin } from '@inlang/paraglide-js'
import { sveltekit } from '@sveltejs/kit/vite'
import devtoolsJson from 'vite-plugin-devtools-json'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [
		// @ts-expect-error types
		sveltekit(),
		// @ts-expect-error types
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide'
		}),
		// @ts-expect-error types
		devtoolsJson()
	],
	server: {
		port: 5173,
		strictPort: false,
		host: true,
		proxy: {
			'/api': {
				target: process.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080',
				changeOrigin: true,
				secure: false,
				ws: true
			}
		}
	},
	resolve: {
		extensions: ['.js', '.ts', '.svelte']
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: 'playwright',
						instances: [{ browser: 'chromium' }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
})
