import type { DivisionStrategy } from './strategies/base'
import { CustomStrategy } from './strategies/custom'
import { EqualStrategy } from './strategies/equal'
import { FixedStrategy } from './strategies/fixed'
import { ProportionalStrategy } from './strategies/proportional'
import { SharesStrategy } from './strategies/shares'

export class StrategyFactory {
	private strategies = new Map<string, DivisionStrategy>([
		['equal', new EqualStrategy()],
		['shares', new SharesStrategy()],
		['fixed', new FixedStrategy()],
		['proportional', new ProportionalStrategy()],
		['custom', new CustomStrategy()],
	])

	getStrategy(method: string): DivisionStrategy {
		const strategy = this.strategies.get(method)
		if (!strategy) throw new Error(`unknown division method: ${method}`)
		return strategy
	}
}
