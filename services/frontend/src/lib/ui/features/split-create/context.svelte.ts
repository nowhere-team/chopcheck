import { getContext, setContext } from 'svelte'
import { SvelteSet } from 'svelte/reactivity'

import { Selection } from '$lib/shared/selection.svelte'

import { SheetMachine } from './machine.svelte'

const SPLIT_CREATE_KEY = Symbol('split-create')

export class SplitCreateContext {
	sheets: SheetMachine
	selection: Selection<string>

	// local editable state
	localName = $state('')
	localIcon = $state('🍔')
	localCurrency = $state('RUB')

	// collapsed groups
	collapsedGroups = $state<Set<string>>(new SvelteSet())

	constructor() {
		this.sheets = new SheetMachine()
		this.selection = new Selection<string>()
	}

	toggleGroup(id: string): void {
		const newSet = new SvelteSet(this.collapsedGroups)
		if (newSet.has(id)) {
			newSet.delete(id)
		} else {
			newSet.add(id)
		}
		this.collapsedGroups = newSet
	}

	initFromDraft(data: { name?: string; icon?: string; currency?: string }): void {
		if (data.name) this.localName = data.name
		if (data.icon) this.localIcon = data.icon
		if (data.currency) this.localCurrency = data.currency
	}
}

export function createSplitCreateContext(): SplitCreateContext {
	return new SplitCreateContext()
}

export function setSplitCreateContext(ctx: SplitCreateContext): void {
	setContext(SPLIT_CREATE_KEY, ctx)
}

export function getSplitCreateContext(): SplitCreateContext {
	const ctx = getContext<SplitCreateContext>(SPLIT_CREATE_KEY)
	if (!ctx) {
		throw new Error('SplitCreateContext not found. Ensure provider is mounted.')
	}
	return ctx
}
