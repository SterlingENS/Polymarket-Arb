export interface ArbitrageOpportunity {
  marketId: string;
  question: string;
  outcomes: string[];
  prices: number[];
  impliedProbabilitySum: number;
  profitPercentage: number;
  investment: number;
  expectedProfit: number;
  timestamp: number;
}

export interface BotConfig {
  minProfitPercentage: number;
  checkIntervalMs: number;
  maxPositionSizeUsdc: number;
  polymarketApiUrl: string;
  polymarketGammaApiUrl: string;
}

export interface BotStats {
  totalOpportunities: number;
  isRunning: boolean;
}

export interface BotStatus {
  isRunning: boolean;
  config: BotConfig;
  opportunities: ArbitrageOpportunity[];
  stats: BotStats;
}
