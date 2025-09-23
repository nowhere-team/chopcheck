import { start, stop } from '@/bootstrap'

const app = await start()

// graceful shutdown
const SHUTDOWN_SIGNALS = ['SIGTERM', 'SIGINT', 'SIGKILL'] as const

for (const signal of SHUTDOWN_SIGNALS) {
	process.on(signal, async () => {
		try {
			await stop(app)
			process.exit(0)
		} catch (error) {
			process.exit(1)
		}
	})
}
