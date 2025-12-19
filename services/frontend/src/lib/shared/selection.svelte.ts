import { SvelteSet } from 'svelte/reactivity'

export class Selection<T extends string = string> {
	active = $state(false)
	ids = $state<Set<T>>(new SvelteSet())

	get count(): number {
		return this.ids.size
	}

	toggle(id: T): void {
		const newSet = new SvelteSet(this.ids)
		if (newSet.has(id)) {
			newSet.delete(id)
			if (newSet.size === 0) this.active = false
		} else {
			newSet.add(id)
		}
		this.ids = newSet
	}

	select(id: T): void {
		if (!this.ids.has(id)) {
			this.ids = new SvelteSet([...this.ids, id])
		}
	}

	deselect(id: T): void {
		if (this.ids.has(id)) {
			const newSet = new SvelteSet(this.ids)
			newSet.delete(id)
			this.ids = newSet
			if (newSet.size === 0) this.active = false
		}
	}

	selectMany(items: T[]): void {
		this.ids = new SvelteSet([...this.ids, ...items])
		if (items.length > 0) this.active = true
	}

	clear(): void {
		this.active = false
		this.ids = new SvelteSet()
	}

	has(id: T): boolean {
		return this.ids.has(id)
	}

	startWith(id: T): void {
		this.active = true
		this.ids = new SvelteSet([id])
	}
}

export function createSelection<T extends string = string>(): Selection<T> {
	return new Selection<T>()
}
