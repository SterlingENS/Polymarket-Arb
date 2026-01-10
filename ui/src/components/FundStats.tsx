'use client';

import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useTradingFund } from '@/hooks/useTradingFund';

export default function FundStats() {
  const { fundState } = useTradingFund();

  if (!fundState) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const roi = fundState.totalDeposits > 0
    ? ((fundState.totalValue - fundState.totalDeposits) / fundState.totalDeposits) * 100
    : 0;

  const stats = [
    {
      label: 'Total Value',
      value: `${(fundState.totalValue / LAMPORTS_PER_SOL).toFixed(2)} SOL`,
      icon: '💰',
      color: 'from-green-400 to-green-600',
    },
    {
      label: 'Total Deposits',
      value: `${(fundState.totalDeposits / LAMPORTS_PER_SOL).toFixed(2)} SOL`,
      icon: '📥',
      color: 'from-blue-400 to-blue-600',
    },
    {
      label: 'Total Profit',
      value: `${(fundState.totalProfit / LAMPORTS_PER_SOL).toFixed(2)} SOL`,
      icon: '📈',
      color: 'from-purple-400 to-purple-600',
    },
    {
      label: 'ROI',
      value: `${roi.toFixed(2)}%`,
      icon: '🎯',
      color: roi >= 0 ? 'from-emerald-400 to-emerald-600' : 'from-red-400 to-red-600',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Fund Statistics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${stat.color} p-6 text-white shadow-lg transform transition hover:scale-105`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium opacity-90">{stat.label}</p>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <div className="absolute -right-4 -bottom-4 text-6xl opacity-10">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Total Shares</p>
          <p className="text-xl font-semibold text-gray-800">
            {fundState.totalShares.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Profit to Token</p>
          <p className="text-xl font-semibold text-gray-800">
            {fundState.profitToTokenPercentage}%
          </p>
        </div>
      </div>
    </div>
  );
}
