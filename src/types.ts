export interface Market {
  condition_id: string;
  question_id: string;
  question: string;
  market_slug: string;
  end_date_iso: string;
  description: string;
  tokens: Token[];
  outcomes: string[];
  active: boolean;
  closed: boolean;
  volume: string;
  liquidity: string;
}

export interface Token {
  token_id: string;
  outcome: string;
  price: string;
  winner: boolean;
}

export interface OrderBookSummary {
  market: string;
  asset_id: string;
  bids: BookLevel[];
  asks: BookLevel[];
  timestamp: number;
}

export interface BookLevel {
  price: string;
  size: string;
}

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
