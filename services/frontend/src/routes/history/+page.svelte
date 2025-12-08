<script lang="ts">
	import { onMount } from 'svelte'

	import { getSplitsStore } from '$lib/state'
	import { Button, Card, EditableText, PriceInput } from '$lib/ui/components'
	import SplitCardSkeleton from '$lib/ui/features/splits/SplitCardSkeleton.svelte'
	import { toast } from '$lib/ui/features/toasts'
	import Page from '$lib/ui/layouts/Page.svelte'

	const splitsStore = getSplitsStore()
	const draftQuery = splitsStore.draft
	const createOrUpdate = splitsStore.createOrUpdate

	let name = $state('')
	let currency = $state('RUB')
	let isLoading = $state(true)
	let isSaving = $state(false)
	let sum = $state(0)
	let draftId: string | undefined

	onMount(async () => {
		try {
			isLoading = true
			await draftQuery.fetch()
			if (draftQuery.data) {
				name = draftQuery.data.split.name
				currency = draftQuery.data.split.currency
				draftId = draftQuery.data.split.id
			}
		} catch {
			// already processed
		} finally {
			isLoading = false
		}
	})

	async function saveDraft() {
		isSaving = true
		try {
			const dto: any = { name, currency }
			if (draftId) dto.id = draftId
			const res = await createOrUpdate.mutate(dto)
			if (res) {
				toast.success('Черновик сохранён')
				draftId = res.split.id
			} else {
				toast.error('Не удалось сохранить черновик')
			}
		} finally {
			isSaving = false
		}
	}
</script>

<Page title="Создать сплит">
	{#if isLoading}
		<Card>
			<SplitCardSkeleton count={1} />
		</Card>
	{:else}
		<Card>
			<EditableText bind:value={name} placeholder="Название сплита" />
			<div style="height: 12px"></div>
			<PriceInput label="Примерная сумма" bind:value={sum} currencySymbol="₽" />
			<div style="height: 16px"></div>

			<div class="actions">
				<Button variant="secondary" onclick={saveDraft} loading={isSaving}
					>Сохранить как черновик</Button
				>
				<Button
					variant="primary"
					onclick={() => {
						/* publish flow */
					}}>Опубликовать</Button
				>
			</div>
		</Card>
	{/if}
</Page>

<style>
	.actions {
		display: flex;
		gap: var(--space-3);
		margin-top: var(--space-4);
	}
</style>
