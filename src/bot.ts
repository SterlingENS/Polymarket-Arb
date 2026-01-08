import { PolymarketClient } from './polymarket-client';
import { ArbitrageDetector } from './arbitrage-detector';
import { BotConfig, ArbitrageOpportunity } from './types';

export class PolymarketArbitrageBot {
  private client: PolymarketClient;
  private detector: ArbitrageDetector;
  private config: BotConfig;
  private isRunning: boolean = false;
  private opportunities: ArbitrageOpportunity[] = [];

  constructor(config: BotConfig) {
    this.config = config;
    this.client = new PolymarketClient(
      config.polymarketApiUrl,
      config.polymarketGammaApiUrl
    );
    this.detector = new ArbitrageDetector(config.minProfitPercentage);
  }

  /**
   * Start the arbitrage bot
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Bot is already running');
      return;
    }

    this.isRunning = true;
    console.log('🤖 Polymarket Arbitrage Bot Started');
    console.log('='.repeat(80));
    console.log(`Min Profit Threshold: ${this.config.minProfitPercentage}%`);
    console.log(`Check Interval: ${this.config.checkIntervalMs}ms`);
    console.log(`Max Position Size: $${this.config.maxPositionSizeUsdc}`);
    console.log('='.repeat(80));
    console.log('\nSearching for arbitrage opportunities...\n');

    await this.run();
  }

  /**
   * Stop the arbitrage bot
   */
  stop(): void {
    this.isRunning = false;
    console.log('\n🛑 Bot stopped');
  }

  /**
   * Main bot loop
   */
  private async run(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.scanForOpportunities();
        await this.sleep(this.config.checkIntervalMs);
      } catch (error) {
        console.error('Error in bot loop:', error);
        await this.sleep(this.config.checkIntervalMs);
      }
    }
  }

  /**
   * Scan all markets for arbitrage opportunities
   */
  private async scanForOpportunities(): Promise<void> {
    console.log(`[${new Date().toISOString()}] Scanning markets...`);

    const markets = await this.client.getActiveMarkets();

    if (markets.length === 0) {
      console.log('No active markets found');
      return;
    }

    console.log(`Found ${markets.length} active markets`);

    let opportunitiesFound = 0;

    for (const market of markets) {
      try {
        // Get current prices for the market
        const prices = await this.client.getMarketPrices(market);

        // Check for arbitrage
        const opportunity = this.detector.detectArbitrage(market, prices);

        if (opportunity) {
          opportunitiesFound++;
          this.opportunities.push(opportunity);
          console.log(this.detector.formatOpportunity(opportunity));

          // Calculate position sizes
          const positions = this.detector.calculatePositionSize(
            opportunity,
            this.config.maxPositionSizeUsdc
          );

          console.log('\nRecommended positions:');
          for (const [outcome, size] of Object.entries(positions)) {
            console.log(`  ${outcome}: $${size.toFixed(2)}`);
          }
          console.log('');
        }
      } catch (error) {
        console.error(`Error processing market ${market.condition_id}:`, error);
      }
    }

    if (opportunitiesFound === 0) {
      console.log('No arbitrage opportunities found in this scan\n');
    } else {
      console.log(`✅ Found ${opportunitiesFound} arbitrage opportunities!\n`);
    }
  }

  /**
   * Get all detected opportunities
   */
  getOpportunities(): ArbitrageOpportunity[] {
    return this.opportunities;
  }

  /**
   * Clear detected opportunities
   */
  clearOpportunities(): void {
    this.opportunities = [];
  }

  /**
   * Get bot statistics
   */
  getStats(): { totalOpportunities: number; isRunning: boolean } {
    return {
      totalOpportunities: this.opportunities.length,
      isRunning: this.isRunning,
    };
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
