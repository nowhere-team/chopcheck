import { getContext, setContext } from 'svelte'

import { getMyDraft, saveDraft } from '$api/drafts'
import type { Split } from '$api/types'
import { m } from '$lib/i18n'
import { getPersistedStorage } from '$lib/storage/persisted'
import type { DraftItem, DraftSplit } from '$lib/types/draft'

const DRAFT_KEY = Symbol('draft')
const STORAGE_KEY = 'split_draft'
const AUTO_SAVE_DELAY = 2000

interface DraftContext {
	split: DraftSplit
	isLoading: boolean
	isSaving: boolean
	error: string | null
	serverDraft: Split | null
	load: () => Promise<void>
	save: () => Promise<void>
	updateName: (name: string) => void
	updateIcon: (icon: string) => void
	updateCurrency: (currency: string) => void
	addItem: (item: DraftItem) => void
	updateItem: (index: number, item: DraftItem) => void
	removeItem: (index: number) => void
	clear: () => Promise<void>
	publish: () => Promise<string>
}

const defaultDraft: DraftSplit = {
	name: '',
	icon: '🍔',
	currency: 'RUB',
	items: []
}

export function setDraftContext() {
	const storage = getPersistedStorage()

	let split = $state<DraftSplit>({ ...defaultDraft })
	let isLoading = $state(false)
	let isSaving = $state(false)
	let error = $state<string | null>(null)
	let serverDraft = $state<Split | null>(null)
	let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

	async function syncToStorage() {
		try {
			await storage.set(STORAGE_KEY, split)
		} catch (err) {
			console.error('failed to save draft to storage:', err)
		}
	}

	function scheduleAutoSave() {
		if (autoSaveTimer) {
			clearTimeout(autoSaveTimer)
		}

		autoSaveTimer = setTimeout(() => {
			save()
		}, AUTO_SAVE_DELAY)
	}

	async function load() {
		isLoading = true
		error = null

		try {
			const [storedDraft, remoteDraft] = await Promise.all([
				storage.get<DraftSplit>(STORAGE_KEY),
				getMyDraft()
			])

			serverDraft = remoteDraft

			if (storedDraft) {
				split = storedDraft
			} else if (remoteDraft) {
				split = {
					id: remoteDraft.id,
					name: remoteDraft.name,
					icon: remoteDraft.icon || '🍔',
					currency: remoteDraft.currency,
					items:
						remoteDraft.items?.map(item => ({
							id: item.id,
							name: item.name,
							price: item.price,
							quantity: item.quantity,
							type: item.type,
							defaultDivisionMethod: item.defaultDivisionMethod
						})) || [],
					lastSyncedAt: remoteDraft.updatedAt
				}
			} else {
				split = { ...defaultDraft }
			}
		} catch (err) {
			error = err instanceof Error ? err.message : m.error_draft_load_failed()
			console.error('failed to load draft:', err)
		} finally {
			isLoading = false
		}
	}

	async function save() {
		if (autoSaveTimer) {
			clearTimeout(autoSaveTimer)
			autoSaveTimer = null
		}

		if (!split.name?.trim()) {
			return
		}

		isSaving = true
		error = null

		try {
			const savedSplit = await saveDraft({
				id: split.id,
				name: split.name,
				icon: split.icon,
				currency: split.currency,
				items: split.items.map(item => ({
					id: item.id,
					name: item.name,
					price: item.price,
					quantity: item.quantity,
					type: item.type,
					defaultDivisionMethod: item.defaultDivisionMethod
				}))
			})

			split.id = savedSplit.id
			split.lastSyncedAt = savedSplit.updatedAt
			serverDraft = savedSplit

			await syncToStorage()
		} catch (err) {
			error = err instanceof Error ? err.message : m.error_draft_save_failed()
			console.error('failed to save draft:', err)
		} finally {
			isSaving = false
		}
	}

	function updateName(name: string) {
		split.name = name
		syncToStorage()
		scheduleAutoSave()
	}

	function updateIcon(icon: string) {
		split.icon = icon
		syncToStorage()
		scheduleAutoSave()
	}

	function updateCurrency(currency: string) {
		split.currency = currency
		syncToStorage()
		scheduleAutoSave()
	}

	function addItem(item: DraftItem) {
		split.items = [...split.items, { ...item }]
		syncToStorage()
		scheduleAutoSave()
	}

	function updateItem(index: number, item: DraftItem) {
		split.items = split.items.map((existing, i) => (i === index ? { ...item } : existing))
		syncToStorage()
		scheduleAutoSave()
	}

	function removeItem(index: number) {
		split.items = split.items.filter((_, i) => i !== index)
		syncToStorage()
		scheduleAutoSave()
	}

	async function clear() {
		split = { ...defaultDraft }
		serverDraft = null
		await storage.remove(STORAGE_KEY)
	}

	async function publish(): Promise<string> {
		if (!split.name?.trim()) {
			throw new Error(m.error_split_name_empty())
		}

		if (split.items.length === 0) {
			throw new Error(m.error_split_no_items())
		}

		error = null
		await save()

		if (error) {
			throw new Error(error)
		}

		if (!split.id) {
			throw new Error(m.error_split_save_failed())
		}

		return split.id
	}

	const context: DraftContext = {
		get split() {
			return split
		},
		get isLoading() {
			return isLoading
		},
		get isSaving() {
			return isSaving
		},
		get error() {
			return error
		},
		get serverDraft() {
			return serverDraft
		},
		load,
		save,
		updateName,
		updateIcon,
		updateCurrency,
		addItem,
		updateItem,
		removeItem,
		clear,
		publish
	}

	setContext(DRAFT_KEY, context)
	return context
}

export function getDraftContext() {
	const context = getContext<DraftContext>(DRAFT_KEY)
	if (!context) {
		throw new Error('draft context not found')
	}
	return context
}
