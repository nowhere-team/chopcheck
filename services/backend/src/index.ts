import { start, stop } from '@/bootstrap'

const app = await start()

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
	process.on(signal, async () => {
		try {
			await stop(app)
			process.exit(0)
		} catch {
			process.exit(1)
		}
	})
}
