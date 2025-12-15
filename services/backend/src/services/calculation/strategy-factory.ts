import { DivisionStrategy } from './strategies/base'
import { ByAmountStrategy } from './strategies/by-amount'
import { ByFractionStrategy } from './strategies/by-fraction'
import { CustomStrategy } from './strategies/custom'
import { PerUnitStrategy } from './strategies/per-unit'

export class StrategyFactory {
	private strategies = new Map<string, DivisionStrategy>([
		['by_fraction', new ByFractionStrategy()],
		['by_amount', new ByAmountStrategy()],
		['per_unit', new PerUnitStrategy()],
		['custom', new CustomStrategy()],
	])

	getStrategy(method: string): DivisionStrategy {
		// fallback for legacy data during migration period
		if (method === 'equal' || method === 'shares') return this.strategies.get('by_fraction')!
		if (method === 'fixed') return this.strategies.get('per_unit')!
		if (method === 'proportional') return this.strategies.get('by_amount')!

		const strategy = this.strategies.get(method)
		if (!strategy) throw new Error(`unknown division method: ${method}`)
		return strategy
	}
}
