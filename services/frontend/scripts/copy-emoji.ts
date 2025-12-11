import { cp, mkdir } from 'fs/promises'
import { dirname, join, resolve } from 'path'

const staticDir = resolve(import.meta.dir, '../static/emoji')

try {
	// @ts-expect-error bun issues
	await import('fluent-optimized/package.json')
	const packagePath = Bun.resolveSync('fluent-optimized/package.json', dirname(import.meta.path))
	const generatedPath = join(packagePath, '../generated')

	await mkdir(staticDir, { recursive: true })
	await cp(generatedPath, staticDir, { recursive: true, force: true })

	console.log('emoji copied successfully')
} catch (error) {
	console.error('failed to copy emoji:', error.message)
	process.exit(0)
}
