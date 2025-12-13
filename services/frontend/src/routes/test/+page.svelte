<script lang="ts">
	import { Calendar, Heart, House, Plus, Trash, User } from 'phosphor-svelte'

	import { getPlatform } from '$lib/app/context.svelte'
	import type { Participant, Split, SplitItem } from '$lib/services/api/types'
	import {
		Avatar,
		AvatarStack,
		Badge,
		Button,
		Card,
		Checkbox,
		Divider,
		Emoji,
		ExpandableCard,
		Icon,
		Input,
		Skeleton,
		SkeletonText,
		Spinner,
		Toggle
	} from '$lib/ui/components'
	import ReceiptLoader from '$lib/ui/features/receipts/ReceiptLoader.svelte'
	import ScannerSheet from '$lib/ui/features/receipts/ScannerSheet.svelte'
	import ItemCard from '$lib/ui/features/splits/ItemCard.svelte'
	import ParticipantsSheet from '$lib/ui/features/splits/ParticipantsSheet.svelte'
	import SplitCard from '$lib/ui/features/splits/SplitCard.svelte'
	import SplitCardSkeleton from '$lib/ui/features/splits/SplitCardSkeleton.svelte'
	import StatsBox from '$lib/ui/features/stats/StatsBox.svelte'
	import StatsSkeleton from '$lib/ui/features/stats/StatsSkeleton.svelte'
	import { toast } from '$lib/ui/features/toasts'
	import {
		CollapsibleSection,
		EditableEmoji,
		EditableText,
		EmojiPickerSheet,
		PriceInput,
		Select
	} from '$lib/ui/forms'
	import Page from '$lib/ui/layouts/Page.svelte'
	import SelectionToolbar from '$lib/ui/layouts/SelectionToolbar.svelte'
	import BottomSheet from '$lib/ui/overlays/BottomSheet.svelte'

	const platform = getPlatform()

	// form state
	let textValue = $state('Тестовое название')
	let emojiValue = $state('🍕')
	let priceValue = $state(125000)
	let selectValue = $state('equal')
	let inputValue = $state('')
	let toggleValue = $state(true)
	let checkboxValue = $state(false)

	// sheets state
	let isBottomSheetOpen = $state(false)
	let isEmojiPickerOpen = $state(false)
	let isScannerOpen = $state(false)
	let isParticipantsOpen = $state(false)

	// selection state
	let selectedCount = $state(0)

	const selectOptions = [
		{ value: 'equal', label: 'Поровну' },
		{ value: 'shares', label: 'По долям' },
		{ value: 'custom', label: 'Точные суммы' }
	]

	// mock data
	const mockSplit: Split = {
		id: 'test-1',
		shortId: 'abc123',
		name: 'Шашлыки на даче',
		icon: '🍖',
		currency: 'RUB',
		status: 'active',
		phase: 'voting',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		items: []
	}

	const mockItem: SplitItem = {
		id: 'item-1',
		name: 'Пицца Маргарита',
		price: 59900,
		quantity: '1',
		type: 'product',
		icon: '🍕',
		defaultDivisionMethod: 'equal'
	}

	const mockParticipants: Participant[] = [
		{
			id: 'p1',
			userId: 'u1',
			displayName: 'Алексей',
			isAnonymous: false,
			joinedAt: new Date().toISOString(),
			user: { id: 'u1', displayName: 'Алексей', username: 'alex' }
		},
		{
			id: 'p2',
			userId: 'u2',
			displayName: 'Мария',
			isAnonymous: false,
			joinedAt: new Date().toISOString(),
			user: { id: 'u2', displayName: 'Мария', avatarUrl: 'https://i.pravatar.cc/100?u=maria' }
		}
	]

	const avatarStackItems = [
		{ id: '1', name: 'Алексей' },
		{ id: '2', name: 'Мария' },
		{ id: '3', name: 'Дмитрий' },
		{ id: '4', name: 'Анна' },
		{ id: '5', name: 'Сергей' }
	]

	function showToast(type: 'success' | 'error' | 'warning' | 'info') {
		const messages = {
			success: 'Операция выполнена успешно',
			error: 'Произошла ошибка',
			warning: 'Внимание! Проверьте данные',
			info: 'Информационное сообщение'
		}
		toast[type](messages[type])
		platform.haptic.notification(type === 'error' ? 'error' : 'success')
	}
</script>

<Page title="Компоненты">
	<!-- Selection Toolbar Demo -->
	{#if selectedCount > 0}
		<SelectionToolbar
			count={selectedCount}
			oncancel={() => (selectedCount = 0)}
			ondelete={() => {
				toast.success('Удалено')
				selectedCount = 0
			}}
		/>
	{/if}

	<!-- Buttons -->
	<CollapsibleSection title="Кнопки" count={6}>
		<div class="demo-grid">
			<Button variant="primary">Primary</Button>
			<Button variant="secondary">Secondary</Button>
			<Button variant="ghost">Ghost</Button>
			<Button variant="danger">Danger</Button>
			<Button variant="primary" loading>Loading</Button>
			<Button variant="primary" disabled>Disabled</Button>
		</div>

		<Divider spacing="sm" />

		<div class="demo-row">
			<Button variant="primary" size="sm">Small</Button>
			<Button variant="primary" size="md">Medium</Button>
			<Button variant="primary" size="lg">Large</Button>
		</div>

		<Divider spacing="sm" />

		<div class="demo-row">
			<Button variant="secondary">
				{#snippet iconLeft()}<Plus size={18} />{/snippet}
				С иконкой
			</Button>
			<Button variant="danger">
				{#snippet iconLeft()}<Trash size={18} />{/snippet}
			</Button>
		</div>
	</CollapsibleSection>

	<!-- Inputs -->
	<CollapsibleSection title="Поля ввода" count={5}>
		<div class="demo-stack">
			<Input label="Текстовое поле" bind:value={inputValue} placeholder="Введите текст..." />

			<Input label="С ошибкой" value="неверное значение" error="Поле заполнено некорректно" />

			<PriceInput label="Сумма" bind:value={priceValue} />

			<Select label="Метод разделения" bind:value={selectValue} options={selectOptions} />

			<div class="demo-row">
				<div class="demo-item">
					<span class="demo-label">Toggle</span>
					<Toggle bind:checked={toggleValue} />
				</div>
				<div class="demo-item">
					<Checkbox bind:checked={checkboxValue} label="Checkbox" />
				</div>
			</div>
		</div>
	</CollapsibleSection>

	<!-- Editable Fields -->
	<CollapsibleSection title="Редактируемые поля" count={2}>
		<div class="demo-stack">
			<div class="demo-centered">
				<EditableEmoji bind:value={emojiValue} size={64} centered />
			</div>

			<EditableText
				bind:value={textValue}
				placeholder="Название..."
				centered
				adaptive
				animated
			/>
		</div>
	</CollapsibleSection>

	<!-- Avatars -->
	<CollapsibleSection title="Аватары" count={4}>
		<div class="demo-row">
			<Avatar id="1" name="Алексей Петров" size={48} />
			<Avatar id="2" name="Мария" url="https://i.pravatar.cc/100?u=2" size={48} />
			<Avatar id="3" name="Pizza" icon="🍕" size={48} />
			<Avatar id="4" name="Pizza" icon="🎉" variant="plain" size={48} />
		</div>

		<Divider spacing="sm" />

		<div class="demo-row">
			<AvatarStack items={avatarStackItems} max={4} size={36} />
		</div>
	</CollapsibleSection>

	<!-- Cards -->
	<CollapsibleSection title="Карточки" count={4}>
		<Card variant="default">
			<p>Default Card</p>
		</Card>

		<Card variant="elevated">
			<p>Elevated Card</p>
		</Card>

		<Card variant="outlined">
			<p>Outlined Card</p>
		</Card>

		<Card interactive onclick={() => toast.info('Клик по карточке')}>
			<p>Interactive Card (нажми)</p>
		</Card>

		<ExpandableCard title="Expandable Card" onclick={() => toast.info('Открыть детали')}>
			<span>Подзаголовок</span>
			{#snippet preview()}
				<Badge count={3} />
			{/snippet}
		</ExpandableCard>
	</CollapsibleSection>

	<!-- Icons & Emoji -->
	<CollapsibleSection title="Иконки и эмодзи" count={8}>
		<div class="demo-row">
			<Icon size={40} variant="placard" color="var(--color-primary)">
				<House size={24} weight="fill" />
			</Icon>
			<Icon size={40} variant="placard" color="var(--color-error)">
				<Heart size={24} weight="fill" />
			</Icon>
			<Icon size={40} variant="placard" color="var(--color-success)">
				<User size={24} weight="fill" />
			</Icon>
			<Icon size={40} variant="placard" shape="circle">
				<Calendar size={24} />
			</Icon>
		</div>

		<Divider spacing="sm" />

		<div class="demo-row">
			<Emoji emoji="🍕" size={40} />
			<Emoji emoji="🎉" size={40} />
			<Emoji emoji="❤️" size={40} />
			<Emoji emoji="🔥" size={40} />
		</div>

		<Divider spacing="sm" />

		<div class="demo-row">
			<Badge count={5} />
			<Badge count={99} />
			<Badge count={999} size={28} />
		</div>
	</CollapsibleSection>

	<!-- Spinners & Skeletons -->
	<CollapsibleSection title="Загрузка" count={3}>
		<div class="demo-row">
			<Spinner size="sm" />
			<Spinner size="md" />
			<Spinner size="lg" />
			<Spinner size="md" variant="muted" />
		</div>

		<Divider spacing="sm" />

		<div class="demo-stack">
			<Skeleton width="100%" height="40px" />
			<div class="demo-row">
				<Skeleton circle width="48px" height="48px" />
				<div style="flex: 1">
					<SkeletonText lines={2} />
				</div>
			</div>
		</div>
	</CollapsibleSection>

	<!-- Toasts -->
	<CollapsibleSection title="Уведомления" count={4}>
		<div class="demo-grid">
			<Button variant="secondary" size="sm" onclick={() => showToast('success')}>
				Success
			</Button>
			<Button variant="secondary" size="sm" onclick={() => showToast('error')}>Error</Button>
			<Button variant="secondary" size="sm" onclick={() => showToast('warning')}>
				Warning
			</Button>
			<Button variant="secondary" size="sm" onclick={() => showToast('info')}>Info</Button>
		</div>
	</CollapsibleSection>

	<!-- Feature Components -->
	<CollapsibleSection title="Фичи: сплиты" count={4}>
		<SplitCard split={mockSplit} onclick={() => toast.info('Открыть сплит')} />

		<Divider spacing="sm" />

		<ItemCard
			item={mockItem}
			onclick={() => toast.info('Открыть позицию')}
			onlongpress={() => {
				selectedCount = 1
				platform.haptic.impact('heavy')
			}}
		/>

		<Divider spacing="sm" />

		<SplitCardSkeleton count={2} />
	</CollapsibleSection>

	<!-- Stats -->
	<CollapsibleSection title="Фичи: статистика" count={2}>
		<div class="demo-row">
			<StatsBox label="Всего сплитов" value={12} />
			<StatsBox label="За месяц" value="4 500 ₽" />
		</div>

		<Divider spacing="sm" />

		<StatsSkeleton />
	</CollapsibleSection>

	<!-- Receipt Loader -->
	<CollapsibleSection title="Фичи: чеки" count={1}>
		<ReceiptLoader
			storeName="Пятёрочка"
			status="Распознаём товары..."
			itemsLoaded={5}
			totalItems={12}
		/>
	</CollapsibleSection>

	<!-- Bottom Sheets -->
	<CollapsibleSection title="Модальные окна" count={4}>
		<div class="demo-grid">
			<Button variant="secondary" onclick={() => (isBottomSheetOpen = true)}>
				Bottom Sheet
			</Button>
			<Button variant="secondary" onclick={() => (isEmojiPickerOpen = true)}>
				Emoji Picker
			</Button>
			<Button variant="secondary" onclick={() => (isScannerOpen = true)}>
				Scanner Sheet
			</Button>
			<Button variant="secondary" onclick={() => (isParticipantsOpen = true)}>
				Participants
			</Button>
		</div>
	</CollapsibleSection>

	<!-- Dividers -->
	<CollapsibleSection title="Разделители" count={3}>
		<Divider spacing="sm" />
		<p class="demo-text">Маленький отступ</p>
		<Divider spacing="md" />
		<p class="demo-text">Средний отступ</p>
		<Divider spacing="lg" width={50} />
		<p class="demo-text">Большой отступ, 50% ширины</p>
	</CollapsibleSection>
</Page>

<!-- Sheets -->
<BottomSheet bind:open={isBottomSheetOpen} title="Тестовый Sheet">
	<div class="sheet-content">
		<p>Контент bottom sheet</p>
		<Button variant="primary" onclick={() => (isBottomSheetOpen = false)}>Закрыть</Button>
	</div>
</BottomSheet>

<EmojiPickerSheet
	bind:open={isEmojiPickerOpen}
	selected={emojiValue}
	onselect={emoji => {
		emojiValue = emoji
		isEmojiPickerOpen = false
	}}
/>

<ScannerSheet
	bind:open={isScannerOpen}
	onscanqr={() => toast.info('Сканирование QR...')}
	onuploadimage={() => toast.info('Загрузка изображения...')}
/>

<ParticipantsSheet
	bind:open={isParticipantsOpen}
	participants={mockParticipants}
	oninvite={() => toast.info('Пригласить участника')}
/>

<style>
	.demo-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-3);
	}

	.demo-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.demo-stack {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.demo-centered {
		display: flex;
		justify-content: center;
	}

	.demo-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.demo-label {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
	}

	.demo-text {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
		text-align: center;
	}

	.sheet-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding-bottom: var(--space-4);
	}
</style>
