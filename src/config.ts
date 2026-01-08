import * as dotenv from 'dotenv';
import { BotConfig } from './types';

dotenv.config();

export function loadConfig(): BotConfig {
  const config: BotConfig = {
    minProfitPercentage: parseFloat(process.env.MIN_PROFIT_PERCENTAGE || '1.0'),
    checkIntervalMs: parseInt(process.env.CHECK_INTERVAL_MS || '5000'),
    maxPositionSizeUsdc: parseFloat(process.env.MAX_POSITION_SIZE_USDC || '100'),
    polymarketApiUrl: process.env.POLYMARKET_API_URL || 'https://clob.polymarket.com',
    polymarketGammaApiUrl: process.env.POLYMARKET_GAMMA_API_URL || 'https://gamma-api.polymarket.com',
  };

  return config;
}

export function validateConfig(config: BotConfig): void {
  if (config.minProfitPercentage < 0) {
    throw new Error('MIN_PROFIT_PERCENTAGE must be >= 0');
  }

  if (config.checkIntervalMs < 1000) {
    throw new Error('CHECK_INTERVAL_MS must be >= 1000 (1 second)');
  }

  if (config.maxPositionSizeUsdc <= 0) {
    throw new Error('MAX_POSITION_SIZE_USDC must be > 0');
  }
}
