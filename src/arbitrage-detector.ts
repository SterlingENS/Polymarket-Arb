import { Market, ArbitrageOpportunity } from './types';

export class ArbitrageDetector {
  private minProfitPercentage: number;

  constructor(minProfitPercentage: number) {
    this.minProfitPercentage = minProfitPercentage;
  }

  /**
   * Detect arbitrage opportunities in a market
   *
   * Arbitrage exists when the sum of implied probabilities < 1
   * For binary markets: if price(YES) + price(NO) < 1, there's an arbitrage opportunity
   *
   * Strategy: Buy both outcomes when their total cost is less than the payout
   */
  detectArbitrage(market: Market, prices: number[]): ArbitrageOpportunity | null {
    if (!market.active || market.closed) {
      return null;
    }

    // Only check markets with valid prices
    if (prices.length === 0 || prices.some(p => p <= 0 || p >= 1)) {
      return null;
    }

    // Calculate the sum of all outcome prices
    const priceSum = prices.reduce((sum, price) => sum + price, 0);

    // Arbitrage exists when price sum < 1 (implied probability < 100%)
    // The profit is (1 - priceSum) / priceSum * 100
    if (priceSum >= 1) {
      return null;
    }

    const costPerUnit = priceSum; // Cost to buy 1 unit of each outcome
    const payoutPerUnit = 1; // Payout is always 1 (one outcome will win)
    const profitPerUnit = payoutPerUnit - costPerUnit;
    const profitPercentage = (profitPerUnit / costPerUnit) * 100;

    // Only return if profit exceeds minimum threshold
    if (profitPercentage < this.minProfitPercentage) {
      return null;
    }

    return {
      marketId: market.condition_id,
      question: market.question,
      outcomes: market.outcomes,
      prices: prices,
      impliedProbabilitySum: priceSum,
      profitPercentage: profitPercentage,
      investment: costPerUnit,
      expectedProfit: profitPerUnit,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate optimal position size based on available capital
   */
  calculatePositionSize(
    opportunity: ArbitrageOpportunity,
    maxPositionSize: number
  ): { [outcome: string]: number } {
    const positions: { [outcome: string]: number } = {};

    // Calculate how many units we can buy with max position size
    const units = maxPositionSize / opportunity.investment;

    // Allocate proportionally to each outcome based on their prices
    for (let i = 0; i < opportunity.outcomes.length; i++) {
      const outcome = opportunity.outcomes[i];
      const price = opportunity.prices[i];
      positions[outcome] = units * price;
    }

    return positions;
  }

  /**
   * Format arbitrage opportunity for display
   */
  formatOpportunity(opportunity: ArbitrageOpportunity): string {
    const lines = [
      '\n' + '='.repeat(80),
      '🎯 ARBITRAGE OPPORTUNITY DETECTED',
      '='.repeat(80),
      `Market: ${opportunity.question}`,
      `Market ID: ${opportunity.marketId}`,
      '',
      'Prices:',
    ];

    opportunity.outcomes.forEach((outcome, i) => {
      lines.push(`  ${outcome}: ${opportunity.prices[i].toFixed(4)} (${(opportunity.prices[i] * 100).toFixed(2)}%)`);
    });

    lines.push('');
    lines.push(`Sum of prices: ${opportunity.impliedProbabilitySum.toFixed(4)}`);
    lines.push(`Profit percentage: ${opportunity.profitPercentage.toFixed(2)}%`);
    lines.push(`Investment needed: $${opportunity.investment.toFixed(4)} per unit`);
    lines.push(`Expected profit: $${opportunity.expectedProfit.toFixed(4)} per unit`);
    lines.push('');
    lines.push('Strategy: Buy all outcomes and guarantee profit when market resolves');
    lines.push('='.repeat(80));

    return lines.join('\n');
  }

  /**
   * Validate that an arbitrage opportunity is still valid
   */
  isOpportunityValid(opportunity: ArbitrageOpportunity, maxAgeMs: number = 10000): boolean {
    const age = Date.now() - opportunity.timestamp;
    return age < maxAgeMs;
  }
}
