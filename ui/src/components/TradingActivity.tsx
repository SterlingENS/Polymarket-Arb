'use client';

import { useEffect, useState } from 'react';

interface Trade {
  id: string;
  timestamp: Date;
  type: 'buy' | 'sell';
  token: string;
  amount: number;
  profit?: number;
}

export default function TradingActivity() {
  const [trades, setTrades] = useState<Trade[]>([]);

  // In production, this would fetch real trade data from the blockchain
  // For now, we'll simulate some activity
  useEffect(() => {
    const mockTrades: Trade[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 60000),
        type: 'buy',
        token: 'BONK',
        amount: 0.5,
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 120000),
        type: 'sell',
        token: 'SAMO',
        amount: 0.8,
        profit: 0.04,
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 180000),
        type: 'buy',
        token: 'FIDA',
        amount: 1.2,
      },
    ];

    setTrades(mockTrades);
  }, []);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Trading Activity</h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live</span>
        </div>
      </div>

      {trades.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-600">No recent trading activity</p>
          <p className="text-sm text-gray-500 mt-2">
            Trades will appear here once the bot starts trading
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    trade.type === 'buy'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {trade.type === 'buy' ? '📈' : '📉'}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {trade.type === 'buy' ? 'Bought' : 'Sold'} {trade.token}
                  </p>
                  <p className="text-sm text-gray-500">{formatTime(trade.timestamp)}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-gray-800">{trade.amount} SOL</p>
                {trade.profit !== undefined && (
                  <p
                    className={`text-sm ${
                      trade.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {trade.profit >= 0 ? '+' : ''}
                    {trade.profit.toFixed(4)} SOL
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Bot Status:</span>
          <span className="flex items-center text-green-600 font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Active
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-600">Next Trade In:</span>
          <span className="font-medium text-gray-800">~23s</span>
        </div>
      </div>
    </div>
  );
}
