export type App = object

export async function start(): Promise<App> {
	console.log('Hello world')
	return {}
}

export async function stop(app: App) {}
