import { DivisionStrategy } from './strategies/base'
import { CustomDivisionStrategy } from './strategies/custom'
import { EqualDivisionStrategy } from './strategies/equal'
import { FixedDivisionStrategy } from './strategies/fixed'
import { ProportionalDivisionStrategy } from './strategies/proportional'
import { SharesDivisionStrategy } from './strategies/shares'

export class StrategyFactory {
	private strategies = new Map<string, DivisionStrategy>([
		['equal', new EqualDivisionStrategy()],
		['shares', new SharesDivisionStrategy()],
		['fixed', new FixedDivisionStrategy()],
		['proportional', new ProportionalDivisionStrategy()],
		['custom', new CustomDivisionStrategy()],
	])

	getStrategy(method: string): DivisionStrategy {
		const strategy = this.strategies.get(method)

		if (!strategy) {
			throw new Error(`unknown division method: ${method}`)
		}

		return strategy
	}
}
