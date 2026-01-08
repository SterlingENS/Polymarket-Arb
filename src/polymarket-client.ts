import axios, { AxiosInstance } from 'axios';
import { Market, OrderBookSummary } from './types';

export class PolymarketClient {
  private clobClient: AxiosInstance;
  private gammaClient: AxiosInstance;

  constructor(clobApiUrl: string, gammaApiUrl: string) {
    this.clobClient = axios.create({
      baseURL: clobApiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.gammaClient = axios.create({
      baseURL: gammaApiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetch all active markets from Polymarket
   */
  async getActiveMarkets(): Promise<Market[]> {
    try {
      const response = await this.gammaClient.get('/markets', {
        params: {
          active: true,
          closed: false,
          limit: 100,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching active markets:', error);
      return [];
    }
  }

  /**
   * Get market details by condition ID
   */
  async getMarket(conditionId: string): Promise<Market | null> {
    try {
      const response = await this.gammaClient.get(`/markets/${conditionId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching market ${conditionId}:`, error);
      return null;
    }
  }

  /**
   * Get order book for a specific token/asset
   */
  async getOrderBook(tokenId: string): Promise<OrderBookSummary | null> {
    try {
      const response = await this.clobClient.get('/book', {
        params: {
          token_id: tokenId,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching order book for ${tokenId}:`, error);
      return null;
    }
  }

  /**
   * Get simplified price data for a market
   */
  async getMarketPrices(market: Market): Promise<number[]> {
    const prices: number[] = [];

    for (const token of market.tokens) {
      const price = parseFloat(token.price);
      prices.push(price);
    }

    return prices;
  }

  /**
   * Get best bid/ask prices from order book
   */
  async getBestPrices(tokenId: string): Promise<{ bid: number; ask: number } | null> {
    const orderBook = await this.getOrderBook(tokenId);

    if (!orderBook || orderBook.bids.length === 0 || orderBook.asks.length === 0) {
      return null;
    }

    const bestBid = parseFloat(orderBook.bids[0].price);
    const bestAsk = parseFloat(orderBook.asks[0].price);

    return { bid: bestBid, ask: bestAsk };
  }
}
