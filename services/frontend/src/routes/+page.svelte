<script>
	import CollapsibleSection from '$components/CollapsibleSection.svelte'
	import StatisticsBox from '$components/StatisticsBox.svelte'
</script>

<div class="page">
	<h1 class="title">Главная</h1>
	<div class="stats">
		<StatisticsBox label="Всего сплитов" value="24" />
		<StatisticsBox label="Разделено за месяц" value="24 343 ₽" />
	</div>
	<CollapsibleSection title="Ваши сплиты" count={5}><p>Проверка</p></CollapsibleSection>
</div>

<style>
	.stats {
		width: 100%;
		display: flex;
		gap: var(--spacing-2-m);
	}
</style>
