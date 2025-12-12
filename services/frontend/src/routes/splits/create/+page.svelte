<script lang="ts">
	import { m } from '$lib/i18n'
	import { getSplitsStore } from '$lib/state'
	import { EditableEmoji, EditableText } from '$lib/ui/forms'
	import Page from '$lib/ui/layouts/Page.svelte'

	const splitsStore = getSplitsStore()

	// draft state - берём данные из query
	const draftQuery = $derived(splitsStore.draft)
	const draftData = $derived(
		draftQuery.data?.split ?? {
			name: '',
			icon: '🍔',
			currency: 'RUB',
			items: []
		}
	)

	// bindable
	const draftSplitEmoji = $derived(draftData.icon ?? '')
	const draftSplitName = $derived(draftData.name)

	// form state
	// const editingItemIndex = $state<number | null>(null)
	// const item = $state<DraftItem>({
	// 	name: '',
	// 	price: 0,
	// 	quantity: '1',
	// 	type: 'product',
	// 	defaultDivisionMethod: 'equal'
	// })
	//
	// const isEditing = $state(true)

	// const isItemEditing = $state(true)
</script>

<Page title={m.app_title_create()}>
	<header>
		<EditableEmoji value={draftSplitEmoji} centered size={34} />
		<EditableText
			value={draftSplitName}
			placeholder={m.create_split_name_label()}
			centered
			adaptive
			animated
		/>
	</header>
</Page>

<!--<BottomSheet open={isEditing}><ItemEditForm {item} /></BottomSheet>-->

<style>
	header {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
</style>
