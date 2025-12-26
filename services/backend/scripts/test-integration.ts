import { $ } from 'bun'

const COMPOSE_FILE = 'docker-compose.test.yml'
const DB_URL = 'postgresql://test:test@localhost:5433/test_db'

async function main() {
	console.log('🐳 starting test containers...')

	try {
		await $`docker compose -f ${COMPOSE_FILE} down -v`.quiet()
	} catch {
		// ignore if containers don't exist
	}

	let exitCode = 0

	try {
		const up = await $`docker compose -f ${COMPOSE_FILE} up -d --wait`
		if (up.exitCode !== 0) {
			console.error('❌ failed to start containers')
			exitCode = 1
			return
		}

		console.log('✅ containers ready')
		console.log('🧪 running tests...')

		const test = await $`bun test tests/integration`.env({
			...process.env,
			DATABASE_URL: DB_URL,
		})

		console.log(test.exitCode === 0 ? '✅ tests passed' : '❌ tests failed')
		exitCode = test.exitCode
	} catch (error) {
		console.error('💥 test execution failed:', error)
		exitCode = 1
	} finally {
		console.log('🧹 cleaning up containers...')
		await $`docker compose -f ${COMPOSE_FILE} down -v`.quiet()
	}

	process.exit(exitCode)
}

main().catch()
