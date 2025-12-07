<script lang="ts">
	import { Gear } from 'phosphor-svelte'

	import { Button, Card } from '$lib/ui/components'
	import Avatar from '$lib/ui/components/Avatar.svelte'
	import BottomSheet from '$lib/ui/components/BottomSheet.svelte'
	import EditableText from '$lib/ui/components/EditableText.svelte'
	import PriceInput from '$lib/ui/components/PriceInput.svelte'
	import Select from '$lib/ui/components/Select.svelte'
	import Toggle from '$lib/ui/components/Toggle.svelte'
	import Page from '$lib/ui/layouts/Page.svelte'

	// состояние для тестов
	let splitName = $state('Шашлыки на даче')
	let selectedMethod = $state('equal')
	let priceValue = $state(125000) // в копейках
	let isNotificationsEnabled = $state(true)
	let isSheetOpen = $state(false)

	const methods = [
		{ value: 'equal', label: 'Поровну' },
		{ value: 'shares', label: 'По долям' },
		{ value: 'exact', label: 'Точные суммы' }
	]
</script>

<Page>
	<!-- Хедер с редактируемым заголовком -->
	<section class="head">
		<Avatar name={splitName} size={80} id="split-main" />
		<EditableText bind:value={splitName} centered placeholder="Название сплита" />
		<div class="status-badge">черновик</div>
	</section>

	<!-- Секция настроек (Inputs test) -->
	<Card variant="elevated">
		<div class="row header-row">
			<h2 class="section-title">Параметры</h2>
			<Button variant="ghost" size="sm" icon={Gear} />
		</div>

		<div class="form-grid">
			<Select label="Метод разделения" bind:value={selectedMethod} options={methods} />

			<PriceInput label="Общая сумма" bind:value={priceValue} currencySymbol="₽" />

			<div class="row setting-row">
				<span class="label">Уведомлять участников</span>
				<Toggle bind:checked={isNotificationsEnabled} />
			</div>
		</div>
	</Card>

	<!-- Демо участников (List test) -->
	<Card>
		<div class="row header-row">
			<h3>Участники</h3>
			<span class="badge">3</span>
		</div>

		<div class="participants">
			<div class="row item">
				<div class="left">
					<Avatar name="Мария Иванова" id="u1" size={40} />
					<div class="info">
						<span class="name">Мария (Вы)</span>
						<span class="role">Организатор</span>
					</div>
				</div>
				<span class="money positive">+500 ₽</span>
			</div>

			<div class="row item">
				<div class="left">
					<Avatar name="Алексей К." id="u2" size={40} />
					<div class="info">
						<span class="name">Алексей</span>
					</div>
				</div>
				<!-- <span class="money negative">-250 ₽</span> -->
			</div>
		</div>

		<div class="actions-row">
			<Button variant="secondary" size="sm" onclick={() => (isSheetOpen = true)}>
				Открыть меню
			</Button>
		</div>
	</Card>

	<!-- Кнопки действий -->
	<div class="floating-actions">
		<Button variant="primary" size="lg">Сохранить изменения</Button>
	</div>
</Page>

<!-- Bottom Sheet Test -->
<BottomSheet bind:open={isSheetOpen} title="Действия" onclose={() => {}}>
	<div class="sheet-content">
		<Button variant="secondary" size="lg">Поделиться ссылкой</Button>
		<Button variant="danger" size="lg">Удалить сплит</Button>
	</div>
</BottomSheet>

<style>
	.head {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4) 0;
	}

	.status-badge {
		font-size: var(--text-xs);
		text-transform: uppercase;
		background: var(--color-bg-secondary);
		padding: 4px 8px;
		border-radius: 6px;
		color: var(--color-text-secondary);
		letter-spacing: 0.05em;
		font-weight: 600;
	}

	.section-title {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
		margin: 0;
	}

	.form-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.row.header-row {
		margin-bottom: var(--space-4);
	}

	.row.item {
		padding: 10px 0;
		border-bottom: 1px solid var(--color-border);
	}

	.row.item:last-child {
		border-bottom: none;
	}

	.row.setting-row {
		padding: 4px 0;
	}

	.left {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.badge {
		background: var(--color-bg-secondary);
		padding: 2px 8px;
		border-radius: 10px;
		font-size: var(--text-sm);
		font-weight: bold;
		color: var(--color-text-primary);
	}

	.participants {
		display: flex;
		flex-direction: column;
	}

	.info {
		display: flex;
		flex-direction: column;
	}

	.name {
		font-weight: 500;
	}
	.role {
		font-size: var(--text-xs);
		color: var(--color-text-tertiary);
	}

	.money {
		font-weight: 600;
		font-size: var(--text-sm);
		font-variant-numeric: tabular-nums;
	}
	.money.positive {
		color: var(--color-success);
	}

	.actions-row {
		margin-top: var(--space-4);
		display: flex;
	}

	.actions-row :global(button) {
		width: 100%;
	}

	.floating-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding-bottom: var(--space-4);
	}

	.sheet-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding-bottom: var(--safe-bottom);
	}

	.label {
		font-size: var(--text-base);
		color: var(--color-text);
	}
</style>
