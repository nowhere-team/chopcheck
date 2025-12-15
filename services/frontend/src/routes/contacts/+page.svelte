<script lang="ts">
	import { getContactsService } from '$lib/state/context'
	import { Avatar, Card, Spinner } from '$lib/ui/components'
	import { CollapsibleSection } from '$lib/ui/forms'
	import Page from '$lib/ui/layouts/Page.svelte'

	const contactsService = getContactsService()
	const list = $derived(contactsService.list)
</script>

<Page title="Контакты">
	<CollapsibleSection title="Все контакты" count={list.current?.length ?? 0}>
		{#if list.loading && !list.current}
			<div class="loading">
				<Spinner size="md" />
			</div>
		{:else if list.current}
			<div class="list">
				{#each list.current as contact (contact.userId)}
					<Card class="contact-card" padding="sm">
						<Avatar
							id={contact.userId}
							name={contact.displayName}
							url={contact.avatarUrl}
							size={40}
						/>
						<div class="info">
							<span class="name">{contact.displayName}</span>
							{#if contact.username}
								<span class="username">@{contact.username}</span>
							{/if}
						</div>
					</Card>
				{/each}
			</div>
		{/if}
	</CollapsibleSection>
</Page>

<style>
	.loading {
		display: flex;
		justify-content: center;
		padding: var(--space-4);
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	:global(.contact-card) {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.info {
		display: flex;
		flex-direction: column;
	}

	.name {
		font-weight: var(--font-medium);
		color: var(--color-text);
	}

	.username {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
	}
</style>
